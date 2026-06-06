// src/pages/community/ThreadDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MessageSquare, Clock, Eye, ArrowLeft, Send, Loader2, Share2, Heart, Link2, Flag, ChevronDown
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { communityPostQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { CommunityPost, Comment } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { communityService } from '@/services/communityService'
import { reportQueries } from '@/lib/supabase/queries'

const POST_TYPE_COLORS: Record<string, string> = {
  discussion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  question: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  opportunity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  internship: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  job: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  announcement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function ThreadDetailPage() {
  const { id = '' } = useParams()
  const { dbUser } = useAuthStore()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagReason, setFlagReason] = useState('')

  useEffect(() => {
    if (id) loadPost()
  }, [id])

  const loadPost = async () => {
    setIsLoading(true)
    const [postData, commentsData] = await Promise.all([
      communityPostQueries.getPostById(id),
      communityPostQueries.getComments(id),
    ])
    setPost(postData)
    setComments(commentsData)
    setIsLoading(false)
  }

  const handleLike = async () => {
    if (!dbUser?.id) {
      toast.error('Sign in to like posts')
      return
    }
    if (!post || isLiking) return
    setIsLiking(true)
    try {
      const result = await communityService.toggleLike({ postId: post.id })
      setPost(prev => prev ? { ...prev, like_count: Math.max(0, prev.like_count + (result.status === 'liked' ? 1 : -1)) } : prev)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to like post')
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async () => {
    if (!dbUser?.id) {
      toast.error('Sign in to comment')
      return
    }
    if (!post || !commentContent.trim()) return
    setIsPosting(true)
    try {
      const result = await communityService.addComment({
        postId: post.id,
        content: commentContent.trim(),
      })
      setComments(prev => [...prev, result.data as Comment])
      setCommentContent('')
      setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev)
      toast.success('Comment posted!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to comment')
    } finally {
      setIsPosting(false)
    }
  }

  const handleShare = async (mode: 'copy' | 'native') => {
    const url = window.location.href
    if (mode === 'native' && navigator.share) {
      try {
        await navigator.share({ title: post?.title, url })
        setShareOpen(false)
        return
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
    setShareOpen(false)
  }

  const handleFlag = async () => {
    if (!dbUser?.id) {
      toast.error('Sign in to report content')
      return
    }
    if (!post || !flagReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    try {
      await reportQueries.createReport({
        reporter_id: dbUser.id,
        target_type: 'post',
        target_id: post.id,
        reason: flagReason.trim(),
      })
      toast.success('Report submitted. Admins will review it.')
      setFlagOpen(false)
      setFlagReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit report')
    }
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

  if (!post) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 text-center">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-white">Post not found</h2>
          <Link to="/community" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">← Back to Community</Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto min-w-0">
        <Link to="/community" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${POST_TYPE_COLORS[post.post_type]}`}>
              {post.post_type}
            </span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">#{tag}</span>
            ))}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 break-safe leading-tight">{post.title}</h1>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6 break-safe">{post.content}</p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3 min-w-0">
              {post.author && (
                <>
                  <Avatar name={post.author.full_name} imageUrl={post.author.profile_picture_url} />
                  <div className="min-w-0">
                    <Link to={`/profile/${post.author_id}`} className="block text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate">
                      {post.author.full_name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="capitalize">{post.author.role}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border border-border hover:bg-accent"
              >
                <Heart className="w-4 h-4" />
                {post.like_count}
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground border border-border">
                <Eye className="w-4 h-4" />
                {post.view_count}
              </div>
              <div className="relative">
                <button
                  onClick={() => { setShareOpen(v => !v); setFlagOpen(false) }}
                  className="flex items-center gap-1 p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground"
                >
                  <Share2 className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                {shareOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                    <button onClick={() => handleShare('copy')} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left">
                      <Link2 className="w-4 h-4" /> Copy link
                    </button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button onClick={() => handleShare('native')} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left">
                        <Share2 className="w-4 h-4" /> Share…
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => { setFlagOpen(v => !v); setShareOpen(false) }}
                  className="p-2 rounded-xl border border-border hover:bg-accent transition-colors text-muted-foreground"
                  title="Report post"
                >
                  <Flag className="w-4 h-4" />
                </button>
                {flagOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg z-20 p-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Report this post</p>
                    <textarea
                      value={flagReason}
                      onChange={e => setFlagReason(e.target.value)}
                      rows={2}
                      placeholder="Reason for report..."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs mb-2"
                    />
                    <button onClick={handleFlag} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg">
                      Submit Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border rounded-2xl text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No comments yet. Be the first to respond!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="p-4 sm:p-5 rounded-2xl border border-border bg-card">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-safe">{comment.content}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      {comment.author && (
                        <>
                          <Avatar name={comment.author.full_name} imageUrl={comment.author.profile_picture_url} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{comment.author.full_name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{comment.author.role}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add a Comment</h3>
          {!dbUser && (
            <p className="text-sm text-muted-foreground mb-3">
              <Link to="/auth/login" className="text-blue-600 hover:underline">Sign in</Link> to join the discussion.
            </p>
          )}
          <textarea
            disabled={!dbUser}
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            rows={4}
            placeholder="Share your thoughts..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none transition-all"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={dbUser?.full_name || ''} imageUrl={dbUser?.profile_picture_url} size="sm" />
              <span className="text-xs text-muted-foreground truncate">Commenting as <strong>{dbUser?.full_name}</strong></span>
            </div>
            <button
              onClick={handleComment}
              disabled={!dbUser || isPosting || !commentContent.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isPosting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
