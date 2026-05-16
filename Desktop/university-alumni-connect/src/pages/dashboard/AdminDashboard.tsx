

// src/app/dashboard/admin/page.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, Briefcase, Calendar, Bell, Clock,
  CheckCircle, XCircle, Shield, TrendingUp, Eye, UserCheck,
  UserX, Search, Filter, MoreVertical, AlertTriangle
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { userQueries, notificationQueries } from '@/lib/supabase/queries'
import { supabase } from '@/lib/supabase/client'
import type { User, DashboardStats, Task } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{sub}</div>}
    </div>
  )
}

function PendingUserRow({ user, onApprove, onReject }: { user: User; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    setLoading('approve')
    await onApprove(user.id)
    setLoading(null)
  }
  const handleReject = async () => {
    setLoading('reject')
    await onReject(user.id)
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800/50 bg-card transition-all">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
        {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{user.full_name}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full capitalize">
            {user.role}
          </span>
          <span className="text-xs text-muted-foreground">{user.registration_number}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground hidden sm:block">
        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
        >
          {loading === 'approve' ? '...' : <><CheckCircle className="w-3.5 h-3.5" /> Approve</>}
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
        >
          {loading === 'reject' ? '...' : <><XCircle className="w-3.5 h-3.5" /> Reject</>}
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { dbUser } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [statsData, pendingData, tasksData] = await Promise.all([
      userQueries.getDashboardStats(),
      userQueries.getAllUsers({ status: 'pending', limit: 5 }),
      supabase.from('tasks').select('*, alumni:users(full_name, email)').order('created_at', { ascending: false }).limit(5),
    ])
    setStats(statsData)
    setPendingUsers(pendingData.data)
    setRecentTasks((tasksData.data as unknown as Task[]) || [])
    setIsLoading(false)
  }

  const handleApprove = async (userId: string) => {
    await userQueries.updateStatus(userId, 'approved')
    const user = pendingUsers.find(u => u.id === userId)
    if (user) {
      await notificationQueries.createNotification({
        user_id: userId,
        type: 'account_approved',
        title: 'Account Approved! 🎉',
        message: 'Welcome to the University Alumni Connect community. You can now access all features.',
        link: user.role === 'alumni' ? '/dashboard/alumni' : '/dashboard/student',
      })
    }
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
    setStats(prev => prev ? { ...prev, pending_requests: prev.pending_requests - 1, total_alumni: user?.role === 'alumni' ? prev.total_alumni + 1 : prev.total_alumni, total_students: user?.role === 'student' ? prev.total_students + 1 : prev.total_students } : prev)
    toast.success('User approved successfully!')
  }

  const handleReject = async (userId: string) => {
    await userQueries.updateStatus(userId, 'rejected')
    const user = pendingUsers.find(u => u.id === userId)
    if (user) {
      await notificationQueries.createNotification({
        user_id: userId,
        type: 'account_rejected',
        title: 'Account Application Update',
        message: 'Your account application was not approved. Contact admin for more information.',
      })
    }
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
    setStats(prev => prev ? { ...prev, pending_requests: prev.pending_requests - 1 } : prev)
    toast.success('User rejected.')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {dbUser?.full_name?.split(' ')[0]}. Here&apos;s what&apos;s happening.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/admin/approvals" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:block">Manage Approvals</span>
              {stats && stats.pending_requests > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {stats.pending_requests}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Alumni" value={stats.total_alumni} icon={GraduationCap} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600" sub="+12 this month" />
            <StatCard label="Active Students" value={stats.total_students} icon={Users} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" sub="+8 this month" />
            <StatCard label="Pending Approvals" value={stats.pending_requests} icon={Clock} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" />
            <StatCard label="Total Tasks" value={stats.total_tasks} icon={Briefcase} color="bg-violet-100 dark:bg-violet-900/30 text-violet-600" />
            <StatCard label="Events" value={stats.total_events} icon={Calendar} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600" />
            <StatCard label="Community Threads" value={stats.total_threads} icon={Shield} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Pending Approvals</h2>
              <Link to="/dashboard/admin/approvals" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">No pending approvals!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map(user => (
                  <PendingUserRow key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Task Uploads</h2>
              <Link to="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task: Task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      task.priority === 'urgent' ? 'bg-red-500' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      task.status === 'assigned' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Approve Users', href: '/dashboard/admin/approvals', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Manage Users', href: '/dashboard/admin/users', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Create Event', href: '/events/new', icon: Calendar, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
              { label: 'View Community', href: '/community', icon: Shield, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} to={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} border border-border hover:shadow-sm transition-all`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
