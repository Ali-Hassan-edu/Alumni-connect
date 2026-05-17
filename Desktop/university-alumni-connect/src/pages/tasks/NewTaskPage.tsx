

// src/app/tasks/new/page.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { approvalQueries, notificationQueries, userQueries } from '@/lib/supabase/queries'
import { taskSchema } from '@/lib/validations'
import type { TaskFormData } from '@/lib/types'

const COMMON_SKILLS = ['React', 'Next.js', 'Node.js', 'Flutter', 'Python', 'Java', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Firebase', 'UI/UX Design', 'Android', 'iOS', 'Machine Learning', 'Docker', 'AWS', 'PHP', 'Laravel', 'Django']

function SkillTagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = (tag: string) => {
    const t = tag.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
  }
  const remove = (tag: string) => onChange(value.filter(t => t !== tag))

  return (
    <div>
      <div className="min-h-[44px] w-full px-3 py-2 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-1.5 items-center">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
            {tag}
            <button type="button" onClick={() => remove(tag)}><X className="w-3 h-3" /></button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), input && add(input))}
          placeholder={value.length === 0 ? 'Type a skill and press Enter...' : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {COMMON_SKILLS.filter(s => !value.includes(s)).slice(0, 8).map(s => (
          <button key={s} type="button" onClick={() => add(s)} className="px-2 py-0.5 text-xs border border-dashed border-border rounded-full text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-colors">
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function NewTaskPage() {
  const navigate = useNavigate()
  const { dbUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { team_size: 1, priority: 'medium', required_skills: [] },
  })

  const onSubmit = async (data: TaskFormData) => {
    if (!dbUser?.id) return
    setIsLoading(true)
    try {
      const status = dbUser.role === 'super_admin' ? 'approved' : 'pending'
      const { data: task, error } = await supabase.from('tasks').insert({
        ...data,
        posted_by: dbUser.id,
        status,
        team_size: Number(data.team_size),
      }).select().single()

      if (error) throw error

      if (dbUser.role === 'alumni') {
        await approvalQueries.createTaskApproval(task.id, null)
      }

      // Notify admin(s)
      const adminResult = await userQueries.getAllUsers({ role: 'super_admin', status: 'approved', limit: 10 })
      if (adminResult.data.length > 0) {
        await notificationQueries.sendBulkNotification(
          adminResult.data.map(a => a.id),
          {
            type: 'task_uploaded',
            title: 'New Task Uploaded',
            message: `${dbUser.full_name} posted a new task: "${data.title}"`,
            link: `/tasks/${task.id}`,
          }
        )
      }

      toast.success(dbUser.role === 'super_admin'
        ? 'Task posted and published!'
        : 'Task submitted! Admin will review and approve.'
      )
      navigate(`/tasks/${task.id}`)
    } catch {
      toast.error('Failed to post task. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all"
  const labelClass = "block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5"
  const errorClass = "mt-1 text-xs text-red-500"

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-md sm:max-w-lg lg:max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tasks" className="p-2 rounded-xl border border-border hover:bg-accent transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words">Post New Task</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Admin will assign suitable students based on skills</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>

            <div>
              <label className={labelClass}>Task Title <span className="text-red-500">*</span></label>
              <input {...register('title')} placeholder="e.g., Build a REST API for e-commerce platform" className={inputClass} />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Description <span className="text-red-500">*</span></label>
              <textarea {...register('description')} rows={4} placeholder="Describe the task in detail. Include requirements, deliverables, and any specific expectations..." className={`${inputClass} resize-vertical min-h-[150px] sm:min-h-[180px]`} />
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Required Skills <span className="text-red-500">*</span></label>
              <Controller
                name="required_skills"
                control={control}
                render={({ field }) => (
                  <SkillTagInput value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.required_skills && <p className={errorClass}>{errors.required_skills.message}</p>}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Task Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Deadline <span className="text-red-500">*</span></label>
                <input {...register('deadline')} type="date" min={new Date().toISOString().split('T')[0]} className={inputClass} />
                {errors.deadline && <p className={errorClass}>{errors.deadline.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Team Size <span className="text-red-500">*</span></label>
                <input {...register('team_size', { valueAsNumber: true })} type="number" min="1" max="10" className={inputClass} />
                {errors.team_size && <p className={errorClass}>{errors.team_size.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Priority <span className="text-red-500">*</span></label>
                <select {...register('priority')} className={inputClass}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
                {errors.priority && <p className={errorClass}>{errors.priority.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Budget / Stipend <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input {...register('budget_stipend')} placeholder="e.g., PKR 15,000 or Unpaid" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <strong>📋 How it works:</strong> After you submit, the admin will review your task and assign suitable students based on skill matching. You&apos;ll be notified once students are assigned.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3">
            <Link to="/tasks" className="w-full sm:w-auto px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors text-center">Cancel</Link>
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors min-h-12">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : <><Plus className="w-4 h-4" /> Post Task</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
