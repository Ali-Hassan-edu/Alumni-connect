import { useState, useEffect } from 'react'
import { X, Users, CheckCircle, Award, Search } from 'lucide-react'
import { taskQueries, profileQueries, notificationQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Task, StudentProfile } from '@/lib/types'
import toast from 'react-hot-toast'

interface MatchingStudent {
  id: string
  full_name: string
  email: string
  profile_picture_url?: string
  skills: string[]
  match_percentage: number
}

interface TaskAssignmentModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TaskAssignmentModal({ task, isOpen, onClose, onSuccess }: TaskAssignmentModalProps) {
  const { dbUser } = useAuthStore()
  const [students, setStudents] = useState<MatchingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState<string | null>(null)
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({})

  useEffect(() => {
    if (isOpen) {
      loadMatchingStudents()
    }
  }, [isOpen])

  const loadMatchingStudents = async () => {
    setLoading(true)
    try {
      const matching = await taskQueries.findMatchingStudents(task.required_skills)
      setStudents(matching.sort((a, b) => b.match_percentage - a.match_percentage))
    } catch (error) {
      console.error('Error loading matching students:', error)
      toast.error('Failed to load matching students')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentProfile = async (studentUserId: string) => {
    if (studentProfiles[studentUserId]) return
    try {
      const profile = await profileQueries.getStudentProfile(studentUserId)
      if (profile) {
        setStudentProfiles(prev => ({ ...prev, [studentUserId]: profile }))
      }
    } catch (error) {
      console.error('Error loading student profile:', error)
    }
  }

  const handleAssignStudent = async (studentId: string) => {
    setAssigning(studentId)
    try {
      const adminId = dbUser?.id || ''
      if (!adminId) {
        toast.error('Admin ID not found')
        return
      }
      await taskQueries.assignTask(task.id, studentId, adminId)

      const student = students.find(s => s.id === studentId)
      if (student) {
        await notificationQueries.createNotification({
          user_id: student.id,
          type: 'task_assigned',
          title: `New Task Assignment: ${task.title}`,
          message: `You have been assigned a task: ${task.title}. View details and start working on it.`,
          link: `/tasks/${task.id}`,
        })
      }

      toast.success(`Task assigned to ${student?.full_name}`)
      setSelectedStudent(null)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error assigning task:', error)
      toast.error('Failed to assign task')
    } finally {
      setAssigning(null)
    }
  }

  const handleBulkAssign = async () => {
    const filteredStudents = students.filter(s => {
      if (search) {
        return s.full_name.toLowerCase().includes(search.toLowerCase()) ||
               s.email.toLowerCase().includes(search.toLowerCase())
      }
      return true
    })

    if (filteredStudents.length === 0) {
      toast.error('No students to assign')
      return
    }

    setAssigning('bulk')
    try {
      const adminId = dbUser?.id || ''
      if (!adminId) {
        toast.error('Admin ID not found')
        return
      }
      let successCount = 0

      for (const student of filteredStudents) {
        try {
          await taskQueries.assignTask(task.id, student.id, adminId)
          await notificationQueries.createNotification({
            user_id: student.id,
            type: 'task_assigned',
            title: `New Task Assignment: ${task.title}`,
            message: `You have been assigned a task: ${task.title}. View details and start working on it.`,
            link: `/tasks/${task.id}`,
          })
          successCount++
        } catch (error) {
          console.error(`Failed to assign to ${student.full_name}:`, error)
        }
      }

      toast.success(`Task assigned to ${successCount} students`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error in bulk assignment:', error)
      toast.error('Bulk assignment failed')
    } finally {
      setAssigning(null)
    }
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true
    return s.full_name.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase())
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Task</h2>
            <p className="text-sm text-muted-foreground mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No students with matching skills found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800/50">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{filteredStudents.length}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">Matching Students</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{task.required_skills.length}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-300">Required Skills</div>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-3">
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedStudent === student.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-card border-border hover:border-blue-200 dark:hover:border-blue-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0">
                        {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{student.full_name}</h3>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {student.match_percentage}%
                              </div>
                              <div className="text-xs text-muted-foreground">Match</div>
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {student.skills.slice(0, 5).map(skill => {
                              const isRequired = task.required_skills.some(s => s.toLowerCase() === skill.toLowerCase())
                              return (
                                <span
                                  key={skill}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isRequired
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                  }`}
                                >
                                  {isRequired && <Award className="w-2.5 h-2.5 inline mr-0.5" />}
                                  {skill}
                                </span>
                              )
                            })}
                            {student.skills.length > 5 && (
                              <span className="text-xs px-2 py-1 text-muted-foreground">
                                +{student.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              loadStudentProfile(student.id)
                              setShowProfile(showProfile === student.id ? null : student.id)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleAssignStudent(student.id)}
                            disabled={assigning !== null}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            {assigning === student.id ? '...' : <><CheckCircle className="w-3.5 h-3.5" /> Assign</>}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Profile Preview */}
                    {showProfile === student.id && studentProfiles[student.id] && (
                      <div className="mt-4 pt-4 border-t border-border text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Semester</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{studentProfiles[student.id].semester}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">CGPA</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{studentProfiles[student.id].cgpa}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {students.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/50">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkAssign}
                disabled={assigning !== null || filteredStudents.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {assigning === 'bulk' ? 'Assigning...' : `Bulk Assign (${filteredStudents.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
