

// src/app/profile/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Mail, Phone, Linkedin, Github, Briefcase, GraduationCap,
  X, Edit, MessageSquare, Star, Calendar, BookOpen, Award, Plus
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TagInput } from '@/components/TagInput'
import { useAuthStore } from '@/lib/stores/authStore'
import { userQueries, messageQueries, profileQueries } from '@/lib/supabase/queries'
import { supabase } from '@/lib/supabase/client'
import type { User, AlumniProfile, StudentProfile } from '@/lib/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface ExtendedProfile {
  // Alumni
  batch?: string
  passing_year?: number
  current_company?: string
  job_title?: string
  skills?: string[]
  achievements?: string[]
  // Student
  semester?: number
  cgpa?: number
  interests?: string[]
  github_url?: string
  resume_url?: string
}

// Profile edit schemas for different user types
const baseProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  short_bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
})

const alumniEditSchema = baseProfileSchema.extend({
  current_company: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
})

const studentEditSchema = baseProfileSchema.extend({
  interests: z.array(z.string()).min(1, 'Add at least one interest'),
  github_url: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  semester: z.number().min(1, 'Semester must be at least 1').max(8, 'Semester cannot exceed 8'),
  cgpa: z.number().min(0, 'CGPA cannot be negative').max(4.0, 'CGPA cannot exceed 4.0'),
})

type AlumniEditFormData = z.infer<typeof alumniEditSchema>
type StudentEditFormData = z.infer<typeof studentEditSchema>

export default function ProfilePage() {
  const { id = '' } = useParams()
  const { dbUser } = useAuthStore()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [threadCount, setThreadCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isOwnProfile = dbUser?.id === id
  const isAlumni = user?.role === 'alumni'

  // Determine schema based on role
  const schema = isAlumni ? alumniEditSchema : studentEditSchema
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const skillsValue = watch('skills')
  const interestsValue = watch('interests')

  useEffect(() => { if (id) loadProfile() }, [id])

  const loadProfile = async () => {
    setIsLoading(true)
    const userData = await userQueries.getById(id)
    setUser(userData)

    if (userData) {
      // Load role-specific profile
      if (userData.role === 'alumni') {
        const { data } = await supabase.from('alumni_profiles').select('*').eq('user_id', id).single()
        setProfile(data)
        // Initialize form with alumni data
        setValue('full_name', userData.full_name)
        setValue('phone', userData.phone || '')
        setValue('linkedin_url', userData.linkedin_url || '')
        setValue('short_bio', userData.short_bio || '')
        setValue('skills', data?.skills || [])
        setValue('current_company', data?.current_company || '')
        setValue('job_title', data?.job_title || '')
      } else if (userData.role === 'student') {
        const { data } = await supabase.from('student_profiles').select('*').eq('user_id', id).single()
        setProfile(data)
        // Initialize form with student data
        setValue('full_name', userData.full_name)
        setValue('phone', userData.phone || '')
        setValue('linkedin_url', userData.linkedin_url || '')
        setValue('short_bio', userData.short_bio || '')
        setValue('skills', data?.skills || [])
        setValue('interests', data?.interests || [])
        setValue('github_url', data?.github_url || '')
        setValue('semester', data?.semester || 1)
        setValue('cgpa', data?.cgpa || 0)
      }

      // Stats
      const [threadRes, taskRes] = await Promise.all([
        supabase.from('threads').select('id', { count: 'exact', head: true }).eq('author_id', id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('posted_by', id),
      ])
      setThreadCount(threadRes.count || 0)
      setTaskCount(taskRes.count || 0)
    }
    setIsLoading(false)
  }

  const handleAddTag = (field: 'skills' | 'interests', tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    const current = field === 'skills' ? skillsValue : interestsValue
    if (!current.includes(trimmed)) {
      setValue(field, [...current, trimmed])
    }
  }

  const handleRemoveTag = (field: 'skills' | 'interests', tag: string) => {
    const current = field === 'skills' ? skillsValue : interestsValue
    setValue(field, current.filter(t => t !== tag))
  }

  const handleSaveProfile = async (data: AlumniEditFormData | StudentEditFormData) => {
    if (!user) return
    setIsSaving(true)

    try {
      // Update users table with common fields
      await userQueries.updateUser(user.id, {
        full_name: data.full_name,
        phone: data.phone || null,
        linkedin_url: data.linkedin_url || null,
        short_bio: data.short_bio || null,
      })

      // Update role-specific profile table
      if (isAlumni) {
        const alumniData = data as AlumniEditFormData
        await profileQueries.upsertAlumniProfile({
          user_id: user.id,
          skills: alumniData.skills,
          current_company: alumniData.current_company || null,
          job_title: alumniData.job_title || null,
        })
      } else {
        const studentData = data as StudentEditFormData
        await profileQueries.upsertStudentProfile({
          user_id: user.id,
          skills: studentData.skills,
          interests: studentData.interests,
          github_url: studentData.github_url || null,
          semester: studentData.semester,
          cgpa: studentData.cgpa,
        })
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...data } : prev)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartChat = async () => {
    if (!dbUser?.id || !user) return
    const conv = await messageQueries.getOrCreateConversation(dbUser.id, user.id)
    navigate('/messages')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h2 className="font-semibold text-xl">User not found</h2>
        </div>
      </DashboardLayout>
    )
  }

  // EDIT MODE
  if (isEditing && isOwnProfile) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

            <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  {...register('full_name')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  {...register('linkedin_url')}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.linkedin_url && <p className="text-sm text-red-600 mt-1">{errors.linkedin_url.message}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2">Short Bio</label>
                <textarea
                  {...register('short_bio')}
                  rows={4}
                  placeholder="Write a short bio about yourself..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.short_bio && <p className="text-sm text-red-600 mt-1">{errors.short_bio.message}</p>}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">Skills</label>
                <TagInput
                  tags={skillsValue}
                  onAdd={(tag) => handleAddTag('skills', tag)}
                  onRemove={(tag) => handleRemoveTag('skills', tag)}
                  placeholder="Type a skill and press Enter"
                />
                {errors.skills && <p className="text-sm text-red-600 mt-1">{errors.skills.message}</p>}
              </div>

              {/* Alumni-specific fields */}
              {isAlumni && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Title</label>
                    <input
                      type="text"
                      {...register('job_title')}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.job_title && <p className="text-sm text-red-600 mt-1">{errors.job_title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Current Company</label>
                    <input
                      type="text"
                      {...register('current_company')}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.current_company && <p className="text-sm text-red-600 mt-1">{errors.current_company.message}</p>}
                  </div>
                </>
              )}

              {/* Student-specific fields */}
              {!isAlumni && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Interests</label>
                    <TagInput
                      tags={interestsValue}
                      onAdd={(tag) => handleAddTag('interests', tag)}
                      onRemove={(tag) => handleRemoveTag('interests', tag)}
                      placeholder="Type an interest and press Enter"
                    />
                    {errors.interests && <p className="text-sm text-red-600 mt-1">{errors.interests.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub URL</label>
                    <input
                      type="url"
                      {...register('github_url')}
                      placeholder="https://github.com/yourprofile"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.github_url && <p className="text-sm text-red-600 mt-1">{errors.github_url.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Semester</label>
                      <input
                        type="number"
                        {...register('semester', { valueAsNumber: true })}
                        min="1"
                        max="8"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.semester && <p className="text-sm text-red-600 mt-1">{errors.semester.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">CGPA</label>
                      <input
                        type="number"
                        {...register('cgpa', { valueAsNumber: true })}
                        min="0"
                        max="4.0"
                        step="0.01"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.cgpa && <p className="text-sm text-red-600 mt-1">{errors.cgpa.message}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // VIEW MODE
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                {user.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt={user.full_name} className="w-24 h-24 rounded-full object-cover mx-auto" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-2xl mx-auto">
                    {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                )}
              </div>

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>

              {/* Role badge */}
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.role === 'alumni' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {user.role === 'alumni' ? '💼 Alumni' : user.role === 'super_admin' ? '🛡️ Admin' : '🎓 Student'}
                </span>
              </div>

              {/* Job/Semester info */}
              {profile?.job_title && profile?.current_company && (
                <p className="text-sm text-muted-foreground mt-2">{profile.job_title} at {profile.current_company}</p>
              )}
              {profile?.semester && profile?.cgpa && (
                <p className="text-sm text-muted-foreground mt-2">Semester {profile.semester} • CGPA: {profile.cgpa}</p>
              )}

              {user.department && (
                <p className="text-xs text-muted-foreground mt-1">{user.department.name}</p>
              )}

              {/* Bio */}
              {user.short_bio ? (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{user.short_bio}</p>
              ) : null}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {isOwnProfile ? (
                  <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleStartChat} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700">
                    <Linkedin className="w-4 h-4 shrink-0" />
                    LinkedIn Profile
                  </a>
                )}
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-foreground">
                    <Github className="w-4 h-4 shrink-0" />
                    GitHub Profile
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{threadCount}</div>
                  <div className="text-xs text-muted-foreground">Threads</div>
                </div>
                {user.role === 'alumni' && (
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{taskCount}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                )}
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">{format(new Date(user.created_at), 'MMM yyyy')}</div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Academic */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-blue-600" />
                Academic Information
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <div className="text-xs text-muted-foreground">Registration No.</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white font-mono">{user.registration_number}</div>
                </div>
                {user.department && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="text-xs text-muted-foreground">Department</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{user.department.name}</div>
                  </div>
                )}
                {profile?.batch && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="text-xs text-muted-foreground">Batch</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{profile.batch}</div>
                  </div>
                )}
                {profile?.passing_year && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="text-xs text-muted-foreground">Graduated</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{profile.passing_year}</div>
                  </div>
                )}
                {profile?.semester && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="text-xs text-muted-foreground">Semester</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{profile.semester}</div>
                  </div>
                )}
                {profile?.cgpa && (
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <div className="text-xs text-muted-foreground">CGPA</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{profile.cgpa}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Star className="w-4.5 h-4.5 text-amber-500" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests (students) */}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-emerald-500" />
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(interest => (
                    <span key={interest} className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">{interest}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience (alumni) */}
            {(profile?.current_company || profile?.job_title) && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-violet-500" />
                  Work Experience
                </h2>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {profile?.current_company?.[0] || 'C'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{profile?.job_title}</div>
                    <div className="text-sm text-muted-foreground">{profile?.current_company}</div>
                    <div className="text-xs text-muted-foreground mt-1">Current Position</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
