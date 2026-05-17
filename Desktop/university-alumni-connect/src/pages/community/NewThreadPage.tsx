

// src/app/community/new/page.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { threadQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import { threadSchema } from '@/lib/validations'
import type { ThreadFormData } from '@/lib/types'

const POST_TYPES = [
  { value: 'discussion', label: '💬 Discussion', desc: 'Share thoughts, start a conversation' },
  { value: 'question', label: '❓ Question', desc: 'Ask for advice or help' },
  { value: 'opportunity', label: '🚀 Opportunity', desc: 'Share a collaboration or project' },
  { value: 'internship', label: '🏢 Internship', desc: 'Post or share internship info' },
  { value: 'job', label: '💼 Job', desc: 'Share a job opening or career tip' },
  { value: 'announcement', label: '📢 Announcement', desc: 'Important news for the community' },
]

const COMMON_TAGS = ['react', 'flutter', 'web-dev', 'mobile', 'python', 'career', 'interview', 'internship', 'open-source', 'freelance', 'ai', 'ml', 'cloud', 'devops']

export default function NewThreadPage() {
  const navigate = useNavigate()
  const { dbUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const isAdmin = dbUser?.role === 'super_admin'

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: { post_type: 'discussion' },
  })

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  const onSubmit = async (data: ThreadFormData) => {
    if (!dbUser?.id) return
    if (data.post_type === 'announcement' && !isAdmin) {
      toast.error('Only admins can post announcements.')
      return
    }
    setIsLoading(true)
    try {
      const thread = await threadQueries.createThread({
        ...data,
        author_id: dbUser.id,
        tags,
        is_pinned: false,
        is_locked: false,
      })
      toast.success('Thread posted successfully!')
      navigate(`/community/${thread.id}`)
    } catch {
      toast.error('Failed to post thread. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedType = watch('post_type')
  const availablePostTypes = isAdmin ? POST_TYPES : POST_TYPES.filter(t => t.value !== 'announcement')
  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all"
  const labelClass = "block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5"

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-md sm:max-w-lg lg:max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/community" className="p-2 rounded-xl border border-border hover:bg-accent transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words">New Thread</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Share with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Thread Type */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
            <label className={labelClass}>Thread Type</label>
            <Controller
              name="post_type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availablePostTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => field.onChange(type.value)}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        field.value === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-accent/50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{type.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.post_type && <p className="mt-1 text-xs text-red-500">{errors.post_type.message}</p>}
          </div>

          {/* Title + Content */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input
                {...register('title')}
                placeholder="Write a clear, specific title for your thread..."
                className={inputClass}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Content <span className="text-red-500">*</span></label>
              <textarea
                {...register('content')}
                rows={6}
                placeholder="Describe your topic in detail. The more context you provide, the better responses you'll get..."
                className={`${inputClass} resize-vertical min-h-[150px] sm:min-h-[180px]`}
              />
              {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
            <label className={labelClass}>
              Tags <span className="text-muted-foreground font-normal">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                placeholder="Add a tag..."
                disabled={tags.length >= 5}
                className={`flex-1 ${inputClass}`}
              />
              <button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput || tags.length >= 5} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors min-h-12">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {COMMON_TAGS.filter(t => !tags.includes(t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  disabled={tags.length >= 5}
                  className="text-xs px-2 py-0.5 border border-dashed border-border rounded-full text-muted-foreground hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Posting as */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-4 bg-muted/40 rounded-xl border border-border">
            <div className="flex items-center gap-2.5 text-sm w-full sm:w-auto">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                {dbUser?.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white truncate">Posting as {dbUser?.full_name}</div>
                <div className="text-xs text-muted-foreground capitalize">{dbUser?.role}</div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Link to="/community" className="flex-1 sm:flex-none px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors text-center min-h-10">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors min-h-10"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post Thread'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
