

// src/app/dashboard/alumni/page.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, MessageSquare, Calendar, Users, Plus, ArrowRight,
  TrendingUp, Clock, CheckCircle, Star, Eye
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import type { Task, Thread, Event } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string }) {
  return (
    <Link to={href} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border ${color} hover:shadow-sm transition-all group`}>
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </Link>
  )
}

export default function AlumniDashboard() {
  const { dbUser } = useAuthStore()
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [recentThreads, setRecentThreads] = useState<Thread[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [alumniProfile, setAlumniProfile] = useState<{ skills: string[]; current_company?: string; job_title?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (dbUser?.id) loadData()
  }, [dbUser?.id])

  const loadData = async () => {
    if (!dbUser?.id) return
    const [tasksRes, threadsRes, eventsRes, profileRes] = await Promise.all([
      supabase.from('tasks').select('*, assignments:task_assignments(count)').eq('posted_by', dbUser.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('threads').select('*, author:users(full_name, role, profile_picture_url)').order('created_at', { ascending: false }).limit(5),
      supabase.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString()).order('event_date').limit(3),
      supabase.from('alumni_profiles').select('*').eq('user_id', dbUser.id).single(),
    ])
    setMyTasks((tasksRes.data as unknown as Task[]) || [])
    setRecentThreads((threadsRes.data as unknown as Thread[]) || [])
    setUpcomingEvents((eventsRes.data as unknown as Event[]) || [])
    setAlumniProfile(profileRes.data)
    setIsLoading(false)
  }

  const taskStats = {
    total: myTasks.length,
    open: myTasks.filter(t => t.status === 'open').length,
    assigned: myTasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
    done: myTasks.filter(t => t.status === 'completed').length,
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-3">
              <Avatar name={dbUser?.full_name || ''} imageUrl={dbUser?.profile_picture_url} size="lg" />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {dbUser?.full_name?.split(' ')[0]}! 👋</h1>
                <p className="text-blue-100 text-sm">
                  {alumniProfile?.job_title && alumniProfile?.current_company
                    ? `${alumniProfile.job_title} at ${alumniProfile.current_company}`
                    : 'COMSATS Alumni'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/tasks/new" className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
                <Plus className="w-4 h-4" /> Post New Task
              </Link>
              <Link to="/community/new" className="flex items-center gap-2 px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors">
                <MessageSquare className="w-4 h-4" /> Start Discussion
              </Link>
            </div>
          </div>
        </div>

        {/* My Task Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks Posted', value: taskStats.total, icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Open (unassigned)', value: taskStats.open, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
            { label: 'In Progress', value: taskStats.assigned, icon: TrendingUp, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
            { label: 'Completed', value: taskStats.done, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">My Posted Tasks</h2>
              <Link to="/tasks?mine=true" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-10 h-10 mx-auto text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">You haven&apos;t posted any tasks yet.</p>
                <Link to="/tasks/new" className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Post your first task
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map(task => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-accent/30 transition-all">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                        <span className="text-xs text-muted-foreground">Deadline: {format(new Date(task.deadline), 'MMM d')}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      task.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {task.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction href="/tasks/new" icon={Briefcase} label="Post Task" color="text-blue-600 bg-blue-50 dark:bg-blue-900/20" />
                <QuickAction href="/community/new" icon={MessageSquare} label="New Thread" color="text-violet-600 bg-violet-50 dark:bg-violet-900/20" />
                <QuickAction href="/events" icon={Calendar} label="View Events" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
                <QuickAction href={`/profile/${dbUser?.id}`} icon={Star} label="Edit Profile" color="text-orange-600 bg-orange-50 dark:bg-orange-900/20" />
              </div>
            </div>

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
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-none">{format(new Date(event.event_date), 'dd')}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 leading-none">{format(new Date(event.event_date), 'MMM')}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{event.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{event.event_type.replace('_', ' ')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Community Threads */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Community Discussions</h2>
            <Link to="/community" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Go to Community →</Link>
          </div>
          {recentThreads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No discussions yet. Start the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentThreads.map(thread => (
                <Link key={thread.id} to={`/community/${thread.id}`} className="thread-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      thread.post_type === 'question' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                      thread.post_type === 'job' || thread.post_type === 'internship' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>{thread.post_type}</span>
                    {thread.is_pinned && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{thread.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{thread.author?.full_name}</span>
                    <div className="flex items-center gap-3">
                      <span>{thread.reply_count} replies</span>
                      <span>{thread.upvote_count} votes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
