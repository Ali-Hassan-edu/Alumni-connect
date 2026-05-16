

// src/app/community/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ChevronUp, MessageSquare, Clock, Eye, ArrowLeft, CheckCircle,
  Lock, Star, Send, Loader2, Flag, Share2, Pin
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { threadQueries, notificationQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Thread, ThreadReply } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

const POST_TYPE_COLORS: Record<string, string> = {
  discussion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  question: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  opportunity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  internship: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  job: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  announcement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

function ReplyCard({
  reply,
  isAuthor,
  isThreadAuthor,
  onAccept,
}: {
  reply: ThreadReply
  isAuthor: boolean
  isThreadAuthor: boolean
  onAccept: (replyId: string) => void
}) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${reply.is_accepted_answer ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-border bg-card'}`}>
      {reply.is_accepted_answer && (
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
          <CheckCircle className="w-4 h-4" /> Accepted Answer
        </div>
      )}
      <div className="flex gap-4">
        {/* Vote */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold">{reply.upvote_count}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {reply.author && (
                <>
                  <Avatar name={reply.author.full_name} imageUrl={reply.author.profile_picture_url} size="sm" />
                  <div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{reply.author.full_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{reply.author.role}</div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
              </span>
              {isThreadAuthor && !reply.is_accepted_answer && (
                <button
                  onClick={() => onAccept(reply.id)}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-300 dark:border-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <CheckCircle className="w-3 h-3" /> Mark Answer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThreadDetailPage() {
  const { id = '' } = useParams()
  const { dbUser } = useAuthStore()
  const navigate = useNavigate()
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<ThreadReply[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isReplying, setIsReplying] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (id) loadThread()
  }, [id])

  const loadThread = async () => {
    setIsLoading(true)
    const [threadData, repliesData] = await Promise.all([
      threadQueries.getThreadById(id),
      threadQueries.getRepliesForThread(id),
    ])
    setThread(threadData)
    setReplies(repliesData)
    // Track view
    if (threadData) {
      supabase.from('threads').update({ view_count: (threadData.view_count || 0) + 1 }).eq('id', id)
    }
    setIsLoading(false)
  }

  const handleVote = async () => {
    if (!dbUser?.id || !thread || hasVoted) return
    await threadQueries.voteThread(dbUser.id, thread.id, 'up')
    setThread(t => t ? { ...t, upvote_count: t.upvote_count + 1 } : t)
    setHasVoted(true)
  }

  const handleReply = async () => {
    if (!dbUser?.id || !thread || !replyContent.trim()) return
    setIsReplying(true)
    try {
      const newReply = await threadQueries.createReply({
        thread_id: thread.id,
        author_id: dbUser.id,
        content: replyContent.trim(),
        upvote_count: 0,
        is_accepted_answer: false,
      })
      setReplies(prev => [...prev, newReply])
      setReplyContent('')
      setThread(t => t ? { ...t, reply_count: t.reply_count + 1 } : t)
      // Notify thread author
      if (thread.author_id !== dbUser.id) {
        await notificationQueries.createNotification({
          user_id: thread.author_id,
          type: 'reply',
          title: `New reply on your thread`,
          message: `${dbUser.full_name} replied to "${thread.title.substring(0, 50)}..."`,
          link: `/community/${thread.id}`,
        })
      }
      toast.success('Reply posted!')
    } catch {
      toast.error('Failed to post reply.')
    } finally {
      setIsReplying(false)
    }
  }

  const handleAcceptAnswer = async (replyId: string) => {
    await supabase.from('thread_replies').update({ is_accepted_answer: false }).eq('thread_id', id)
    await supabase.from('thread_replies').update({ is_accepted_answer: true }).eq('id', replyId)
    setReplies(prev => prev.map(r => ({ ...r, is_accepted_answer: r.id === replyId })))
    toast.success('Answer marked as accepted!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!thread) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 text-center">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-white">Thread not found</h2>
          <Link to="/community" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">← Back to Community</Link>
        </div>
      </DashboardLayout>
    )
  }

  const isThreadAuthor = dbUser?.id === thread.author_id

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Back */}
        <Link to="/community" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>

        {/* Thread */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {thread.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${POST_TYPE_COLORS[thread.post_type]}`}>
              {thread.post_type}
            </span>
            {thread.tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">#{tag}</span>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{thread.title}</h1>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">{thread.content}</p>

          {/* Author + actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              {thread.author && (
                <>
                  <Avatar name={thread.author.full_name} imageUrl={thread.author.profile_picture_url} />
                  <div>
                    <Link to={`/profile/${thread.author_id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">
                      {thread.author.full_name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="capitalize">{thread.author.role}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Vote */}
              <button
                onClick={handleVote}
                disabled={hasVoted || isThreadAuthor}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
                  hasVoted ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' : 'border-border hover:bg-accent disabled:opacity-50'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
                {thread.upvote_count}
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground border border-border">
                <Eye className="w-4 h-4" />
                {thread.view_count}
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border rounded-2xl text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Accepted answers first */}
              {replies.filter(r => r.is_accepted_answer).map(reply => (
                <ReplyCard key={reply.id} reply={reply} isAuthor={dbUser?.id === reply.author_id} isThreadAuthor={isThreadAuthor} onAccept={handleAcceptAnswer} />
              ))}
              {replies.filter(r => !r.is_accepted_answer).map(reply => (
                <ReplyCard key={reply.id} reply={reply} isAuthor={dbUser?.id === reply.author_id} isThreadAuthor={isThreadAuthor} onAccept={handleAcceptAnswer} />
              ))}
            </div>
          )}
        </div>

        {/* Reply Box */}
        {!thread.is_locked ? (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Reply</h3>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              rows={5}
              placeholder="Share your thoughts, experience, or answer..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Avatar name={dbUser?.full_name || ''} imageUrl={dbUser?.profile_picture_url} size="sm" />
                <span className="text-xs text-muted-foreground">Replying as <strong>{dbUser?.full_name}</strong></span>
              </div>
              <button
                onClick={handleReply}
                disabled={isReplying || !replyContent.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isReplying ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground">
            <Lock className="w-4 h-4" /> This thread is locked. No new replies allowed.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
