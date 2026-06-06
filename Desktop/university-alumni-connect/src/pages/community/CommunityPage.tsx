

// src/app/community/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Plus, Search, Filter, ChevronUp, Eye, Clock,
  Star, Pin, Lock, TrendingUp, BookOpen, Briefcase, Users
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { communityPostQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { CommunityPost, PostType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  discussion: { label: 'Discussion', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: MessageSquare },
  question: { label: 'Question', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: BookOpen },
  opportunity: { label: 'Opportunity', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: TrendingUp },
  internship: { label: 'Internship', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Briefcase },
  job: { label: 'Job', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: Briefcase },
  announcement: { label: 'Announcement', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Users },
}

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Discussions', value: 'discussion' },
  { label: 'Questions', value: 'question' },
  { label: 'Jobs', value: 'job' },
  { label: 'Internships', value: 'internship' },
  { label: 'Opportunities', value: 'opportunity' },
  { label: 'Announcements', value: 'announcement' },
]

function ThreadCard({ thread, isPreview }: { thread: CommunityPost; isPreview: boolean }) {
  const config = POST_TYPE_CONFIG[thread.post_type]
  const Icon = config.icon
  const createdAt = formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })

  return (
    <Link to={isPreview ? '/auth/login' : `/community/${thread.id}`} className="block bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-md transition-all">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Vote count */}
        <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 pt-1">
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{thread.like_count}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 flex-wrap">
            <span className="sm:hidden inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              <ChevronUp className="w-3 h-3" />
              {thread.like_count}
            </span>
            {thread.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
            {thread.is_locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium max-w-full ${config.color}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            {thread.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full max-w-[8rem] truncate">{tag}</span>
            ))}
            {thread.tags.length > 2 && (
              <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">+{thread.tags.length - 2}</span>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 mb-2 break-safe text-[15px] sm:text-base leading-snug">
            {thread.title}
          </h3>

          <div className={isPreview ? 'relative' : ''}>
            <p className={`text-sm text-muted-foreground line-clamp-2 mb-4 break-safe leading-relaxed ${isPreview ? 'blur-[1.5px]' : ''}`}>{thread.content}</p>
            {isPreview && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs px-2 py-1 rounded-full bg-white/80 dark:bg-gray-900/80 border border-border text-muted-foreground">
                  Login or Signup to read more
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {thread.author && (
                <>
                  <Avatar name={thread.author.full_name} imageUrl={thread.author.profile_picture_url} size="sm" />
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{thread.author.full_name}</span>
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full capitalize ${
                      thread.author.role === 'alumni' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>{thread.author.role}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap sm:flex-nowrap">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <MessageSquare className="w-3.5 h-3.5" />
                {thread.comment_count}
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Eye className="w-3.5 h-3.5" />
                {thread.view_count}
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {createdAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CommunityPage() {
  const { dbUser } = useAuthStore()
  const [threads, setThreads] = useState<CommunityPost[]>([])
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadThreads = useCallback(async (pageToLoad: number, reset = false) => {
    setIsLoading(true)
    try {
      const result = await communityPostQueries.getPublicPosts({
        post_type: filter !== 'all' ? filter as PostType : undefined,
        search: search || undefined,
        page: pageToLoad,
        limit: 15,
      })
      if (reset) {
        setThreads(result.data)
        setPage(1)
      } else {
        setThreads(prev => [...prev, ...result.data])
        setPage(pageToLoad)
      }
      setHasMore(result.data.length === 15)
    } catch (err) {
      console.error('Failed to load community posts:', err)
      if (reset) setThreads([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    loadThreads(1, true)
  }, [filter, search, loadThreads])

  useEffect(() => {
    if (!dbUser?.id) return
    communityPostQueries.getPostsByAuthor(dbUser.id)
      .then(setMyPosts)
      .catch(() => setMyPosts([]))
  }, [dbUser?.id])

  const loadMore = () => {
    const nextPage = page + 1
    loadThreads(nextPage)
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 lg:p-8 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
            <p className="text-muted-foreground text-sm mt-1">Discussions, Q&A, opportunities — all in one place</p>
          </div>
          {dbUser ? (
            <Link
              to="/community/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              New Thread
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center hover:bg-accent"
            >
              Login to Post
            </Link>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* My submissions */}
            {dbUser && myPosts.length > 0 && (
              <div className="mb-6 bg-card border border-border rounded-2xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Submissions</h3>
                <div className="space-y-2">
                  {myPosts.slice(0, 5).map(post => (
                    <div key={post.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{post.title}</div>
                        {post.status === 'rejected' && post.rejection_reason && (
                          <div className="text-xs text-red-500 mt-0.5">Rejected: {post.rejection_reason}</div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        post.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        post.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Search + Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                {FILTERS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      filter === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threads */}
            {isLoading && threads.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No threads found</h3>
                  <p className="text-muted-foreground text-sm">No discussions match your search. Try different filters.</p>
                </div>
                {dbUser && (
                  <div className="flex justify-center">
                    <Link
                      to="/community/new"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Start a Thread
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map(thread => <ThreadCard key={thread.id} thread={thread} isPreview={!dbUser} />)}
                {hasMore && (
                  <button onClick={loadMore} disabled={isLoading} className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 font-medium border border-border rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50">
                    {isLoading ? 'Loading...' : 'Load more threads'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">
            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Community Stats</h3>
              <div className="space-y-2">
                {[
                  { label: 'Discussions', value: threads.filter(t => t.post_type === 'discussion').length },
                  { label: 'Questions', value: threads.filter(t => t.post_type === 'question').length },
                  { label: 'Opportunities', value: threads.filter(t => t.post_type === 'job' || t.post_type === 'internship').length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">Community Guidelines</h3>
              <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-200">
                <li>✅ Be respectful and professional</li>
                <li>✅ Share knowledge and experiences</li>
                <li>✅ Help fellow students and alumni</li>
                <li>❌ No spam or self-promotion</li>
                <li>❌ No offensive content</li>
              </ul>
            </div>

            {/* Thread types */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Thread Types</h3>
              <div className="space-y-2">
                {Object.entries(POST_TYPE_CONFIG).map(([type, { label, color, icon: Icon }]) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${filter === type ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  >
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                      <Icon className="w-3 h-3" />
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
