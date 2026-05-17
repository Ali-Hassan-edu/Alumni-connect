

// src/app/dashboard/alumni/page.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, MessageSquare, Calendar, Users, Plus, ArrowRight,
  TrendingUp, Clock, CheckCircle, Star, Eye, Edit2, Trash2, AlertTriangle, X
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import type { Task, Thread, Event, Announcement } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { responsiveClasses } from '@/lib/responsive'
import { announcementQueries, approvalQueries } from '@/lib/supabase/queries'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import { TagInput } from '@/components/TagInput'
import toast from 'react-hot-toast'

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    required_skills: [] as string[],
    deadline: '',
    budget_stipend: '',
    team_size: 1,
    priority: 'medium' as Task['priority'],
  })

  useEffect(() => {
    if (dbUser?.id) loadData()
  }, [dbUser?.id])

  const loadData = async () => {
    if (!dbUser?.id) return
    const [tasksRes, threadsRes, eventsRes, profileRes, announcementsRes] = await Promise.all([
      supabase.from('tasks').select('*, assignments:task_assignments(count)').eq('posted_by', dbUser.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('threads').select('*, author:users(full_name, role, profile_picture_url)').order('created_at', { ascending: false }).limit(5),
      supabase.from('events').select('*').eq('is_published', true).gte('event_date', new Date().toISOString()).order('event_date').limit(3),
      supabase.from('alumni_profiles').select('*').eq('user_id', dbUser.id).single(),
      announcementQueries.getAnnouncements(),
    ])
    setMyTasks((tasksRes.data as unknown as Task[]) || [])
    setRecentThreads((threadsRes.data as unknown as Thread[]) || [])
    setUpcomingEvents((eventsRes.data as unknown as Event[]) || [])
    setAlumniProfile(profileRes.data)
    setAnnouncements(announcementsRes || [])
    setIsLoading(false)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setEditForm({
      title: task.title,
      description: task.description,
      required_skills: task.required_skills || [],
      deadline: task.deadline?.slice(0, 10) || '',
      budget_stipend: task.budget_stipend || '',
      team_size: task.team_size || 1,
      priority: task.priority,
    })
    setShowEditModal(true)
  }

  const handleSaveTask = async () => {
    if (!editingTask || !dbUser?.id) return
    setSavingTask(true)
    const needsReapproval = ['approved', 'assigned', 'in_progress'].includes(editingTask.status)
    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        required_skills: editForm.required_skills,
        deadline: editForm.deadline,
        budget_stipend: editForm.budget_stipend || null,
        team_size: Number(editForm.team_size),
        priority: editForm.priority,
        status: needsReapproval ? 'pending' : editingTask.status,
      }
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', editingTask.id)
        .eq('posted_by', dbUser.id)
        .select()
        .single()
      if (error) throw error

      if (needsReapproval) {
        await approvalQueries.createTaskApproval(editingTask.id, null)
      }

      setMyTasks(prev => prev.map(t => t.id === editingTask.id ? (data as Task) : t))
      setShowEditModal(false)
      setEditingTask(null)
      toast.success(needsReapproval ? 'Task updated and sent for re-approval.' : 'Task updated successfully.')
    } catch {
      toast.error('Failed to update task.')
    } finally {
      setSavingTask(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask || !dbUser?.id) return
    setDeletingTask(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', editingTask.id)
        .eq('posted_by', dbUser.id)
      if (error) throw error
      setMyTasks(prev => prev.filter(t => t.id !== editingTask.id))
      setShowDeleteModal(false)
      setEditingTask(null)
      toast.success('Task deleted successfully.')
    } catch {
      toast.error('Failed to delete task.')
    } finally {
      setDeletingTask(false)
    }
  }

  const taskStats = {
    total: myTasks.length,
    pending: myTasks.filter(t => t.status === 'pending').length,
    active: myTasks.filter(t => ['approved', 'assigned', 'in_progress'].includes(t.status)).length,
    done: myTasks.filter(t => t.status === 'completed').length,
  }

  return (
    <DashboardLayout>
      <div className={`${responsiveClasses.mobilePadding} space-y-6`}>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
              <Avatar name={dbUser?.full_name || ''} imageUrl={dbUser?.profile_picture_url} size="lg" />
              <div className="flex-1">
                <h1 className={`${responsiveClasses.heading2} font-bold`}>Welcome back, {dbUser?.full_name?.split(' ')[0]}! 👋</h1>
                <p className="text-blue-100 text-sm">
                  {alumniProfile?.job_title && alumniProfile?.current_company
                    ? `${alumniProfile.job_title} at ${alumniProfile.current_company}`
                    : 'COMSATS Alumni'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link to="/tasks/new" className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
                <Plus className="w-4 h-4" /> Post New Task
              </Link>
              <Link to="/community/new" className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors">
                <MessageSquare className="w-4 h-4" /> Start Discussion
              </Link>
            </div>
          </div>
        </div>

        {/* My Task Stats */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 ${responsiveClasses.gapMd}`}>
            {[
              { label: 'Total Tasks Posted', value: taskStats.total, icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Pending Review', value: taskStats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Active Tasks', value: taskStats.active, icon: TrendingUp, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
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

        {/* Announcements */}
        {announcements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Announcements</h2>
              <Link to="/notifications" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${responsiveClasses.gapMd}`}>
              {announcements.slice(0, 3).map(a => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 ${responsiveClasses.gapMd}`}>
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                        <span className="hidden sm:block text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Deadline: {format(new Date(task.deadline), 'MMM d')}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      task.status === 'pending' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' :
                      task.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      task.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {task.status.replace('_', ' ')}
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

        {/* Task Management */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Manage Your Tasks</h2>
            <Link to="/tasks?mine=true" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tasks to manage yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        task.status === 'pending' ? 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' :
                        task.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        task.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Deadline: {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setEditingTask(task)
                        setShowDeleteModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Edit Task</h3>
                <p className="text-xs text-muted-foreground">Editing an approved task will require re-approval.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Required Skills</label>
                <TagInput
                  tags={editForm.required_skills}
                  onAdd={(tag) => setEditForm(prev => ({ ...prev, required_skills: [...prev.required_skills, tag] }))}
                  onRemove={(tag) => setEditForm(prev => ({ ...prev, required_skills: prev.required_skills.filter(s => s !== tag) }))}
                  placeholder="Add a skill..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Team Size</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.team_size}
                    onChange={e => setEditForm(prev => ({ ...prev, team_size: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Budget / Stipend</label>
                  <input
                    value={editForm.budget_stipend}
                    onChange={e => setEditForm(prev => ({ ...prev, budget_stipend: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={savingTask}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                disabled={savingTask}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingTask ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Task</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <strong>{editingTask.title}</strong>?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingTask}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deletingTask}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deletingTask ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
