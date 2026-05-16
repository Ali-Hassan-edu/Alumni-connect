

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
  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/community" className="p-2 rounded-xl border border-border hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Thread</h1>
            <p className="text-muted-foreground text-sm">Share with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Thread Type */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Thread Type</label>
            <Controller
              name="post_type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POST_TYPES.map(type => (
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
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Title <span className="text-red-500">*</span></label>
              <input
                {...register('title')}
                placeholder="Write a clear, specific title for your thread..."
                className={inputClass}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Content <span className="text-red-500">*</span></label>
              <textarea
                {...register('content')}
                rows={8}
                placeholder="Describe your topic in detail. The more context you provide, the better responses you'll get..."
                className={`${inputClass} resize-none`}
              />
              {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
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
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                placeholder="Add a tag..."
                disabled={tags.length >= 5}
                className={`flex-1 ${inputClass}`}
              />
              <button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput || tags.length >= 5} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
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
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                {dbUser?.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Posting as {dbUser?.full_name}</div>
                <div className="text-xs text-muted-foreground capitalize">{dbUser?.role}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/community" className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
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
