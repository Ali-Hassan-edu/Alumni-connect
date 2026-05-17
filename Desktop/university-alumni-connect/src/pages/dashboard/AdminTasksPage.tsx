import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { userQueries } from '@/lib/supabase/queries'
import { TaskAssignmentModal } from '@/components/TaskAssignmentModal'
import { Eye, Send, Search, Briefcase } from 'lucide-react'
import type { Task, User } from '@/lib/types'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

type TaskWithAlumni = Omit<Task, 'alumni'> & {
  alumni?: Pick<User, 'id' | 'full_name' | 'email' | 'profile_picture_url'>
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '🔴 Urgent' },
  high:   { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: '🟠 High' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: '🟡 Medium' },
  low:    { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '🟢 Low' },
}

export default function AdminTasksPage() {
  const { dbUser } = useAuthStore()
  const [tasks, setTasks] = useState<TaskWithAlumni[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithAlumni[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('approved')
  const [selectedTask, setSelectedTask] = useState<TaskWithAlumni | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    let filtered = tasks
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }
    if (search) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.alumni?.full_name || '').toLowerCase().includes(search.toLowerCase())
      )
    }
    setFilteredTasks(filtered)
  }, [tasks, filterStatus, search])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, alumni:users!posted_by(id, full_name, email, profile_picture_url)')
        .in('status', ['approved', 'assigned', 'in_progress'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks((data as unknown as TaskWithAlumni[]) || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAssignment = (task: TaskWithAlumni) => {
    setSelectedTask(task)
    setShowAssignmentModal(true)
  }

  const handleAssignmentSuccess = () => {
    loadTasks()
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Task Management</h1>
          <p className="text-muted-foreground">Approve and assign tasks to matching students</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{tasks.filter(t => t.status === 'approved').length}</div>
            <div className="text-xs text-blue-600 dark:text-blue-300">Approved</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{tasks.filter(t => t.status === 'assigned').length}</div>
            <div className="text-xs text-amber-600 dark:text-amber-300">Assigned</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{filteredTasks.length}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">Shown</div>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No tasks found</h3>
            <p className="text-muted-foreground text-sm">
              {search ? 'Try adjusting your search' : 'All tasks are up to date'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map(task => {
              const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
              const expired = isPast(new Date(task.deadline))
                      const isApproved = task.status === 'approved'

              return (
                <div
                  key={task.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${p.color}`}>
                          {p.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {task.required_skills.slice(0, 5).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {s}
                          </span>
                        ))}
                        {task.required_skills.length > 5 && (
                          <span className="text-xs px-2 py-0.5 text-muted-foreground">
                            +{task.required_skills.length - 5} skills
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
                        <span>by {task.alumni?.full_name || 'Unknown'}</span>
                        <span>•</span>
                        <span className={expired ? 'text-red-500 font-medium' : ''}>
                          {expired ? 'Expired' : format(new Date(task.deadline), 'MMM d, yyyy')}
                        </span>
                        <span>•</span>
                        <span>Team size: {task.team_size}</span>
                        {task.budget_stipend && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">💰 {task.budget_stipend}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        task.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        task.status === 'assigned' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-accent rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>

                    {(isApproved || task.status === 'assigned') && (
                      <button
                        onClick={() => handleOpenAssignment(task)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        {task.status === 'assigned' ? 'Assign More' : 'Assign'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {selectedTask && (
        <TaskAssignmentModal
          task={{ ...selectedTask, alumni: undefined }}
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false)
            setSelectedTask(null)
          }}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </DashboardLayout>
  )
}
