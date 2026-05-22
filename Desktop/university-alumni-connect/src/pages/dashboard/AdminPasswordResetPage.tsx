// src/pages/dashboard/AdminPasswordResetPage.tsx
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, KeyRound, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { passwordResetService } from '@/services/passwordResetService'
import type { PasswordResetRequest } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function AdminPasswordResetPage() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const result = await passwordResetService.fetchRequests()
      setRequests(result.data as PasswordResetRequest[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (requestId: string, action: 'resolved' | 'rejected') => {
    setProcessingId(requestId)
    try {
      await passwordResetService.resolveRequest({
        requestId,
        action,
        tempPassword: action === 'resolved' ? tempPasswords[requestId] : undefined,
        adminNotes: notes[requestId],
      })
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action } : r))
      toast.success(`Request ${action}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password Reset Requests</h1>
          <p className="text-muted-foreground text-sm">Handle student password reset requests</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No requests</h3>
            <p className="text-muted-foreground text-sm">No pending password reset requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{req.user?.full_name || req.email}</h3>
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                    {req.message && <p className="text-sm text-muted-foreground mt-2">{req.message}</p>}
                    <div className="text-xs text-muted-foreground mt-2">
                      Requested {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{req.status}</span>
                </div>

                {req.status === 'pending' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Temporary Password</label>
                      <input
                        value={tempPasswords[req.id] || ''}
                        onChange={e => setTempPasswords(prev => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Generate or enter a temporary password"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Admin Notes</label>
                      <textarea
                        value={notes[req.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                        rows={2}
                        placeholder="Internal notes"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(req.id, 'resolved')}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleResolve(req.id, 'rejected')}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
