// src/pages/dashboard/AdminPostModerationPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, Filter, Trash2, History, ShieldCheck } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { communityService } from '@/services/communityService'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import type { CommunityPost, PostApproval } from '@/lib/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

type QueueStatus = 'pending' | 'approved' | 'rejected'
type ViewTab = 'queue' | 'history'

interface ModerationHistoryItem extends PostApproval {
  post?: {
    id: string
    title: string
    post_type: string
    author?: { id: string; full_name: string }
  }
  admin?: { id: string; full_name: string }
}

export default function AdminPostModerationPage() {
  const { dbUser } = useAuthStore()
  const isSuperAdmin = dbUser?.role === 'super_admin'

  // Queue state
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [status, setStatus] = useState<QueueStatus>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})

  // Tab state
  const [activeTab, setActiveTab] = useState<ViewTab>('queue')

  // History state
  const [history, setHistory] = useState<ModerationHistoryItem[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueue(status)
    } else {
      loadHistory()
    }
  }, [status, activeTab])

  const loadQueue = async (queueStatus: QueueStatus) => {
    setIsLoading(true)
    try {
      const result = await communityService.getModerationQueue(queueStatus)
      setPosts(result.data as CommunityPost[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load moderation queue')
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('post_approvals')
        .select('*, post:community_posts(id, title, post_type, author:users!community_posts_author_id_fkey(id, full_name)), admin:users!post_approvals_acted_by_fkey(id, full_name)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setHistory((data || []) as ModerationHistoryItem[])
    } catch (err) {
      toast.error('Failed to load moderation history')
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  const handleModeration = async (postId: string, action: 'approved' | 'rejected') => {
    setProcessingId(postId)
    try {
      await communityService.moderatePost({
        postId,
        action,
        reason: rejectionReasons[postId],
      })
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success(`Post ${action}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return
    setProcessingId(postId)
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
      if (error) throw error
      setPosts(prev => prev.filter(p => p.id !== postId))
      toast.success('Post deleted permanently')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Moderation</h1>
            <p className="text-muted-foreground text-sm">Review, approve, and manage community posts</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-muted/40 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Moderation Queue
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Moderation History
          </button>
        </div>

        {/* ─── Queue View ─── */}
        {activeTab === 'queue' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QueueStatus)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No posts</h3>
                <p className="text-muted-foreground text-sm">Nothing to review in this queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{post.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {post.author?.full_name} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                        {post.rejection_reason && (
                          <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg">
                            Rejection reason: {post.rejection_reason}
                          </div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize shrink-0">{post.post_type}</span>
                    </div>

                    {/* Pending actions */}
                    {status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={rejectionReasons[post.id] || ''}
                          onChange={e => setRejectionReasons(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Rejection reason (optional)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleModeration(post.id, 'approved')}
                            disabled={processingId === post.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleModeration(post.id, 'rejected')}
                            disabled={processingId === post.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Super admin delete on approved/rejected posts */}
                    {isSuperAdmin && status !== 'pending' && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={processingId === post.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Post Permanently
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── History View ─── */}
        {activeTab === 'history' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reason</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Moderated By</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isHistoryLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="skeleton h-8 w-full rounded-lg" /></td></tr>
                    ))
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                        <History className="w-8 h-8 mx-auto opacity-40 mb-2" />
                        <p className="text-sm">No moderation history yet.</p>
                      </td>
                    </tr>
                  ) : (
                    history.map(item => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                              {item.post?.title || '[Deleted post]'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              by {item.post?.author?.full_name || 'Unknown'} • {item.post?.post_type || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                            item.action === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {item.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground max-w-xs truncate block">
                            {item.reason || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {item.admin?.full_name || 'System'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(item.acted_at || item.created_at), { addSuffix: true })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
