

// src/app/dashboard/admin/approvals/page.tsx
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Search, Filter, Eye, UserCheck, UserX } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { userQueries, notificationQueries } from '@/lib/supabase/queries'
import type { User } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function ApprovalsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadPending()
  }, [])

  const loadPending = async () => {
    setIsLoading(true)
    const result = await userQueries.getAllUsers({ status: 'pending', limit: 50 })
    setUsers(result.data)
    setIsLoading(false)
  }

  const handleAction = async (userId: string, action: 'approved' | 'rejected') => {
    setProcessingId(userId)
    try {
      await userQueries.updateStatus(userId, action)
      const user = users.find(u => u.id === userId)
      if (user) {
        await notificationQueries.createNotification({
          user_id: userId,
          type: action === 'approved' ? 'account_approved' : 'account_rejected',
          title: action === 'approved' ? 'Account Approved! 🎉' : 'Account Application Update',
          message: action === 'approved'
            ? 'Welcome to University Alumni Connect! Your account has been approved.'
            : 'Your account application was not approved. Contact admin for details.',
          link: action === 'approved' ? (user.role === 'alumni' ? '/dashboard/alumni' : '/dashboard/student') : undefined,
        })
      }
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success(`User ${action} successfully`)
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = users.filter(u => {
    const registrationNumber = u.registration_number || ''
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || registrationNumber.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approval Requests</h1>
          <p className="text-muted-foreground text-sm">{users.length} pending {users.length === 1 ? 'request' : 'requests'} awaiting review</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or registration..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="alumni">Alumni Only</option>
            <option value="student">Students Only</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-400">{filtered.length} requests shown</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={async () => {
                  for (const u of filtered.slice(0, 10)) await handleAction(u.id, 'approved')
                }}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Approve All Shown
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">All clear!</h3>
            <p className="text-muted-foreground text-sm">No pending approval requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <div key={user.id} className="bg-card border border-border rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0">
                    {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{user.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAction(user.id, 'approved')}
                          disabled={processingId === user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, 'rejected')}
                          disabled={processingId === user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium capitalize">
                        {user.role === 'alumni' ? '💼 Alumni' : '🎓 Student'}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.registration_number}</span>
                      {user.department && (
                        <span className="text-xs text-muted-foreground">{user.department.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Applied {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {user.short_bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{user.short_bio}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
