

// src/app/dashboard/admin/users/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Shield, UserX, Eye, Plus, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { userQueries } from '@/lib/supabase/queries'
import { Avatar } from '@/components/layout/DashboardLayout'
import type { User } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import { adminService } from '@/services/adminService'

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blocked: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function UsersManagementPage() {
  const { dbUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // Create Sub-Admin States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRegNo, setFormRegNo] = useState('')
  const [formBatch, setFormBatch] = useState(new Date().getFullYear().toString())

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    const result = await userQueries.getAllUsers({
      search: search || undefined,
      role: filterRole !== 'all' ? filterRole as 'alumni' | 'student' | 'super_admin' | 'sub_admin' : undefined,
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

  const handleRoleChange = async (userId: string, role: User['role']) => {
    await userQueries.updateUser(userId, { role })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    toast.success(`User role updated to ${role.replace('_', ' ')}`)
    setOpenMenuId(null)
    
    // Log if a sub-admin is being demoted to student/alumni
    const originalUser = users.find(u => u.id === userId)
    if (originalUser?.role === 'sub_admin' && (role === 'student' || role === 'alumni')) {
      adminService.logActivity({
        action: 'sub_admin_demoted',
        entity_type: 'user',
        entity_id: userId,
        metadata: { new_role: role, email: originalUser.email, full_name: originalUser.full_name }
      }).catch(console.error)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-muted-foreground text-sm">{total} total users in the system</p>
          </div>
          {dbUser?.role === 'super_admin' && (
            <button
              onClick={() => {
                setFormEmail('')
                setFormFullName('')
                setFormPassword('')
                setFormRegNo('')
                setFormBatch(new Date().getFullYear().toString())
                setIsCreateModalOpen(true)
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl active:scale-95 transition-all shadow-md shadow-blue-500/10 text-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Sub-Admin
            </button>
          )}
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
            <option value="sub_admin">Sub Admins</option>
            <option value="super_admin">Super Admins</option>
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
                            {dbUser?.role === 'super_admin' && user.role !== 'super_admin' && (
                              user.role === 'sub_admin' ? (
                                <>
                                  <button onClick={() => handleRoleChange(user.id, 'student')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Shield className="w-4 h-4" /> Revoke to Student
                                  </button>
                                  <button onClick={() => handleRoleChange(user.id, 'alumni')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Shield className="w-4 h-4" /> Revoke to Alumni
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleRoleChange(user.id, 'sub_admin')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                  <Shield className="w-4 h-4" /> Make Sub Admin
                                </button>
                              )
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

      {/* Create Sub-Admin Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <button 
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Sub-Admin</h3>
              <p className="text-xs text-muted-foreground">Register a new sub-administrative account with access to student approvals and moderation.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!formEmail || !formFullName) {
                toast.error('Email and Full Name are required.')
                return
              }
              setIsSubmitting(true)
              try {
                await adminService.createSubAdmin({
                  email: formEmail,
                  password: formPassword || undefined,
                  full_name: formFullName,
                  registration_number: formRegNo || undefined,
                  batch: formBatch || undefined,
                })
                toast.success('Sub-Admin created successfully!')
                setIsCreateModalOpen(false)
                loadUsers()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to create sub-admin')
              } finally {
                setIsSubmitting(false)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formFullName}
                  onChange={e => setFormFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="subadmin@university.edu"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to auto-generate"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Employee/Reg ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SA-2026"
                    value={formRegNo}
                    onChange={e => setFormRegNo(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Batch Year</label>
                  <input
                    type="text"
                    value={formBatch}
                    onChange={e => setFormBatch(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 min-h-11 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
