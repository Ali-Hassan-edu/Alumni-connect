// src/pages/tasks/TasksPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Briefcase, Plus, Search, Users, CalendarDays } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'
import { format, isPast } from 'date-fns'

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '🔴 Urgent' },
  high:   { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: '🟠 High' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: '🟡 Medium' },
  low:    { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '🟢 Low' },
}
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400', label: '⏳ Pending Approval' },
  open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '🔵 Open' },
  approved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: '✅ Approved' },
  assigned: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: '📋 Assigned' },
  in_progress: { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', label: '🔄 In Progress' },
  completed: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: '🏁 Completed' },
  cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '❌ Cancelled' },
  rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '🚫 Rejected' },
}

function TaskCard({ task }: { task: Task & { alumni?: { full_name: string } } }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const s = STATUS_CONFIG[task.status] || STATUS_CONFIG.open
  const expired = isPast(new Date(task.deadline))
  return (
    <Link to={`/tasks/${task.id}`} className="block p-5 bg-card border border-border rounded-2xl hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{task.title}</h3>
          {task.alumni && <p className="text-xs text-muted-foreground mt-0.5">by {task.alumni.full_name}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${p.color}`}>{p.label}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {task.required_skills.slice(0, 4).map(s => (
          <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">{s}</span>
        ))}
        {task.required_skills.length > 4 && <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">+{task.required_skills.length - 4}</span>}
      </div>
      <div className="flex flex-col gap-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`flex items-center gap-1 ${expired ? 'text-red-500' : ''}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              {expired ? 'Expired' : format(new Date(task.deadline), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{task.team_size}</span>
            {task.budget_stipend && <span className="text-emerald-600 dark:text-emerald-400 font-medium">💰 {task.budget_stipend}</span>}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-medium text-xs w-fit ${s.color}`}>{s.label}</span>
      </div>
    </Link>
  )
}

export default function TasksPage() {
  const { dbUser } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const myTasks = searchParams.get('mine') === 'true'

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    let query = supabase.from('tasks').select('*, alumni:users(full_name, profile_picture_url)').order('created_at', { ascending: false })
    
    // Role-based visibility
    if (dbUser?.role === 'student') {
      // Students: only see approved tasks
      query = query.eq('status', 'approved')
    } else if (dbUser?.role === 'alumni') {
      // Alumni: see own tasks only (all statuses)
      if (dbUser?.id) query = query.eq('posted_by', dbUser.id)
    }
    // Admins see all tasks (no status filter)
    
    if (myTasks && dbUser?.id) query = query.eq('posted_by', dbUser.id)
    if (filterStatus !== 'all') query = query.eq('status', filterStatus)
    if (filterPriority !== 'all') query = query.eq('priority', filterPriority)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data } = await query.limit(30)
    setTasks((data as unknown as Task[]) || [])
    setIsLoading(false)
  }, [dbUser?.id, dbUser?.role, myTasks, filterStatus, filterPriority, search])

  useEffect(() => { loadTasks() }, [loadTasks])

  const canPost = dbUser?.role === 'alumni' || dbUser?.role === 'super_admin'

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{myTasks ? 'My Tasks' : 'Task Board'}</h1>
            <p className="text-muted-foreground text-sm">Real-world projects from alumni</p>
          </div>
          {canPost && (
            <Link to="/tasks/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /><span className="hidden sm:block">Post Task</span>
            </Link>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No tasks found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {myTasks ? "You haven't posted any tasks yet." : dbUser?.role === 'student' ? "No approved tasks available yet. Check back soon!" : "No tasks match your filters."}
            </p>
            {canPost && <Link to="/tasks/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"><Plus className="w-4 h-4" /> Post First Task</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task as Task & { alumni?: { full_name: string } }} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
