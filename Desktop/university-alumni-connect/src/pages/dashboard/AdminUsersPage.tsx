

// src/app/dashboard/admin/users/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Shield, UserX, Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { userQueries } from '@/lib/supabase/queries'
import { Avatar } from '@/components/layout/DashboardLayout'
import type { User } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blocked: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    const result = await userQueries.getAllUsers({
      search: search || undefined,
      role: filterRole !== 'all' ? filterRole as 'alumni' | 'student' | 'super_admin' : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      page,
      limit: 15,
    })
    setUsers(result.data)
    setTotal(result.count)
    setIsLoading(false)
  }, [search, filterRole, filterStatus, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleStatusChange = async (userId: string, status: string) => {
    await userQueries.updateStatus(userId, status)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, account_status: status as User['account_status'] } : u))
    toast.success(`User status updated to ${status}`)
    setOpenMenuId(null)
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-muted-foreground text-sm">{total} total users in the system</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Roles</option>
            <option value="alumni">Alumni</option>
            <option value="student">Students</option>
            <option value="super_admin">Admins</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reg. No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="skeleton h-8 w-full rounded-lg" /></td></tr>
                  ))
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name} imageUrl={user.profile_picture_url} size="sm" />
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-medium capitalize text-muted-foreground">{user.role.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">{user.registration_number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[user.account_status]}`}>
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setOpenMenuId(null)}>
                              <Eye className="w-4 h-4" /> View Profile
                            </Link>
                            {user.account_status !== 'approved' && (
                              <button onClick={() => handleStatusChange(user.id, 'approved')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <CheckCircle className="w-4 h-4" /> Approve
                              </button>
                            )}
                            {user.account_status !== 'blocked' && (
                              <button onClick={() => handleStatusChange(user.id, 'blocked')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <UserX className="w-4 h-4" /> Block
                              </button>
                            )}
                            {user.account_status !== 'rejected' && (
                              <button onClick={() => handleStatusChange(user.id, 'rejected')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-accent">
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-accent">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-accent">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
