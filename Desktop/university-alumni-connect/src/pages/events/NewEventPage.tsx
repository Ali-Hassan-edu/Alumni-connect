

// src/app/events/new/page.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { eventQueries, notificationQueries, userQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import { eventSchema } from '@/lib/validations'
import type { EventFormData } from '@/lib/validations'

export default function NewEventPage() {
  const navigate = useNavigate()
  const { dbUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { is_virtual: false, tags: [] },
  })

  const isVirtual = watch('is_virtual')
  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all"
  const labelClass = "block text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5"
  const errorClass = "mt-1 text-xs text-red-500"

  const onSubmit = async (data: EventFormData) => {
    if (!dbUser?.id) return
    setIsLoading(true)
    try {
      const event = await eventQueries.createEvent({
        ...data,
        created_by: dbUser.id,
        is_published: true,
        event_type: data.event_type as import('@/lib/types').EventType,
      })

      // Notify all approved users
      const allUsers = await userQueries.getAllUsers({ status: 'approved', limit: 500 })
      if (allUsers.data.length > 0) {
        await notificationQueries.sendBulkNotification(
          allUsers.data.map(u => u.id),
          {
            type: 'event_created',
            title: `📅 New Event: ${data.title}`,
            message: `A new ${data.event_type.replace('_', ' ')} has been scheduled. Check it out!`,
            link: `/events/${event.id}`,
          }
        )
      }

      toast.success('Event created and all users notified!')
      navigate(`/events/${event.id}`)
    } catch {
      toast.error('Failed to create event.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-md sm:max-w-lg lg:max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/events" className="p-2 rounded-xl border border-border hover:bg-accent transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words">Create Event</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">All approved members will be notified</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Event Information</h2>

            <div>
              <label className={labelClass}>Event Title <span className="text-red-500">*</span></label>
              <input {...register('title')} placeholder="e.g., Annual Alumni Meetup 2025" className={inputClass} />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Description <span className="text-red-500">*</span></label>
              <textarea {...register('description')} rows={3} placeholder="Describe the event, agenda, speakers, etc." className={`${inputClass} resize-vertical min-h-[120px] sm:min-h-[140px]`} />
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Type <span className="text-red-500">*</span></label>
                <select {...register('event_type')} className={inputClass}>
                  <option value="">Select type</option>
                  <option value="alumni_meetup">🤝 Alumni Meetup</option>
                  <option value="seminar">🎤 Seminar</option>
                  <option value="workshop">🛠️ Workshop</option>
                  <option value="career_fair">💼 Career Fair</option>
                  <option value="get_together">🎉 Get Together</option>
                  <option value="webinar">💻 Webinar</option>
                  <option value="other">📅 Other</option>
                </select>
                {errors.event_type && <p className={errorClass}>{errors.event_type.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Max Attendees <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input {...register('max_attendees', { valueAsNumber: true })} type="number" min="1" placeholder="No limit" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Date, Time & Location</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Date & Time <span className="text-red-500">*</span></label>
                <input {...register('event_date')} type="datetime-local" min={new Date().toISOString().slice(0, 16)} className={inputClass} />
                {errors.event_date && <p className={errorClass}>{errors.event_date.message}</p>}
              </div>
              <div>
                <label className={labelClass}>End Date & Time <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input {...register('end_date')} type="datetime-local" className={inputClass} />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <input {...register('is_virtual')} type="checkbox" id="is_virtual" className="w-4 h-4 rounded accent-blue-600" />
              <label htmlFor="is_virtual" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                This is an online/virtual event
              </label>
            </div>

            {!isVirtual && (
              <div>
                <label className={labelClass}>Physical Location <span className="text-red-500">*</span></label>
                <input {...register('location')} placeholder="e.g., Main Auditorium, COMSATS Vehari" className={inputClass} />
                {errors.location && <p className={errorClass}>{errors.location.message}</p>}
              </div>
            )}

            {isVirtual && (
              <div>
                <label className={labelClass}>Online Meeting Link</label>
                <input {...register('virtual_link')} placeholder="https://meet.google.com/..." className={inputClass} />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3">
            <Link to="/events" className="w-full sm:w-auto px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors text-center">Cancel</Link>
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors min-h-12">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Calendar className="w-4 h-4" /> Create Event</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
