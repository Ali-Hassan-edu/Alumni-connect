

// src/app/dashboard/student/page.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, MessageSquare, Calendar, GraduationCap,
  TrendingUp, Clock, CheckCircle, ArrowRight, BookOpen, Star,
  Github, Linkedin, Plus
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { announcementQueries } from '@/lib/supabase/queries'
import type { TaskAssignment, Thread, Event, Announcement } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { responsiveClasses } from '@/lib/responsive'
import { AnnouncementCard } from '@/components/AnnouncementCard'

export default function StudentDashboard() {
  const { dbUser } = useAuthStore()
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [recentThreads, setRecentThreads] = useState<Thread[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [studentProfile, setStudentProfile] = useState<{ skills: string[]; interests: string[]; cgpa: number; semester: number; github_url?: string } | null>(null)
  const [openTasks, setOpenTasks] = useState<{ id: string; title: string; required_skills: string[]; budget_stipend?: string; deadline: string; alumni?: { full_name: string } }[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (dbUser?.id) loadData()
  }, [dbUser?.id])

  const loadData = async () => {
    if (!dbUser?.id) return
    const [assignRes, threadsRes, eventsRes, profileRes, tasksRes, announcementsRes] = await Promise.all([
      supabase.from('task_assignments').select('*, task:tasks(id, title, deadline, priority, status, required_skills, budget_stipend)').eq('student_id', dbUser.id).order('assigned_at', { ascending: false }).limit(5),
      supabase.from('threads').select('*, author:users(full_name, role, profile_picture_url)').order('created_at', { ascending: false }).limit(6),
      supabase.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString()).order('event_date').limit(3),
      supabase.from('student_profiles').select('*').eq('user_id', dbUser.id).single(),
      supabase.from('tasks').select('*, alumni:users(full_name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(4),
      announcementQueries.getAnnouncements(false, 6),
    ])
    setAssignments((assignRes.data as unknown as TaskAssignment[]) || [])
    setRecentThreads((threadsRes.data as unknown as Thread[]) || [])
    setUpcomingEvents((eventsRes.data as unknown as Event[]) || [])
    setStudentProfile(profileRes.data)
    setOpenTasks((tasksRes.data as unknown) as typeof openTasks || [])
    setAnnouncements(announcementsRes || [])
    setIsLoading(false)
  }

  const assignmentStats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'active').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    approved: assignments.filter(a => a.status === 'approved').length,
  }

  return (
    <DashboardLayout>
      <div className={`${responsiveClasses.mobilePadding} space-y-6`}>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <Avatar name={dbUser?.full_name || ''} imageUrl={dbUser?.profile_picture_url} size="lg" />
              <div className="flex-1">
                <h1 className={`${responsiveClasses.heading2} font-bold`}>Hey, {dbUser?.full_name?.split(' ')[0]}! 🎓</h1>
                <p className="text-emerald-100 text-sm mt-1">
                  {studentProfile ? `Semester ${studentProfile.semester} • CGPA: ${studentProfile.cgpa}` : 'Student'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {studentProfile?.github_url && (
                    <a href={studentProfile.github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {dbUser?.linkedin_url && (
                    <a href={dbUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <Link to="/community/new" className="flex items-center gap-1.5 px-3 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-xs font-medium hover:bg-white/30 transition-colors whitespace-nowrap justify-center">
                <MessageSquare className="w-3.5 h-3.5" /> New Thread
              </Link>
              <Link to="/tasks" className="flex items-center gap-1.5 px-3 py-2 bg-white text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors whitespace-nowrap justify-center">
                <Briefcase className="w-3.5 h-3.5" /> Browse Tasks
              </Link>
            </div>
          </div>
        </div>

        {/* Assignment Stats */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 ${responsiveClasses.gapMd}`}>
          {[
            { label: 'Assigned Tasks', value: assignmentStats.total, icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Active', value: assignmentStats.active, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Submitted', value: assignmentStats.submitted, icon: TrendingUp, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
            { label: 'Completed', value: assignmentStats.approved, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 ${responsiveClasses.gapMd}`}>
          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">Announcements</h2>
                <Link to="/notifications" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${responsiveClasses.gapMd}`}>
                {announcements.slice(0, 3).map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            </div>
          )}

          {/* My Assignments */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">My Assigned Tasks</h2>
                <Link to="/tasks?assigned=true" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="w-10 h-10 mx-auto text-muted-foreground opacity-40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No tasks assigned yet.</p>
                  <p className="text-xs text-muted-foreground">Admin assigns tasks based on your skills. Make sure your skills are up to date!</p>
                  <Link to={`/profile/${dbUser?.id}`} className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700">
                    Update Skills <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map(assignment => (
                    <Link key={assignment.id} to={`/tasks/${assignment.task_id}`} className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:bg-accent/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{(assignment.task as unknown as { title: string })?.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned {formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        assignment.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        assignment.status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        assignment.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Open Tasks to Apply */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Available Opportunities</h2>
                <Link to="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Browse all →</Link>
              </div>
              {openTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No open tasks at the moment</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {openTasks.map(task => (
                    <Link key={task.id} to={`/tasks/${task.id}`} className="p-4 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-accent/30 transition-all">
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">{task.title}</div>
                      <div className="text-xs text-muted-foreground mb-2">by {task.alumni?.full_name}</div>
                      {task.budget_stipend && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">💰 {task.budget_stipend}</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {task.required_skills.slice(0, 3).map(skill => (
                          <span key={skill} className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">{skill}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Skills */}
            {studentProfile?.skills && studentProfile.skills.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Your Skills</h2>
                  <Link to={`/profile/${dbUser?.id}`} className="text-xs text-blue-600 hover:text-blue-700">Edit →</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.skills.map(skill => (
                    <span key={skill} className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
                <Link to="/events" className="text-xs text-blue-600 hover:text-blue-700">All →</Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <Link key={event.id} to={`/events/${event.id}`} className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-none">{format(new Date(event.event_date), 'dd')}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 leading-none">{format(new Date(event.event_date), 'MMM')}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{event.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{event.event_type.replace('_', ' ')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Access</h2>
              <div className="space-y-2">
                {[
                  { href: '/community', label: 'Community Forum', icon: MessageSquare },
                  { href: '/tasks', label: 'Browse All Tasks', icon: Briefcase },
                  { href: '/events', label: 'Events & Meetups', icon: Calendar },
                  { href: `/profile/${dbUser?.id}`, label: 'My Profile', icon: GraduationCap },
                ].map(({ href, label, icon: Icon }) => (
                  <Link key={href} to={href} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors text-sm text-gray-700 dark:text-gray-300">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Community Threads */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Discussions</h2>
            <Link to="/community" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Go to Community →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentThreads.map(thread => (
              <Link key={thread.id} to={`/community/${thread.id}`} className="thread-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    thread.post_type === 'question' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                    thread.post_type === 'job' || thread.post_type === 'internship' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>{thread.post_type}</span>
                </div>
                <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{thread.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{thread.author?.full_name}</span>
                  <span>{thread.reply_count} replies</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
