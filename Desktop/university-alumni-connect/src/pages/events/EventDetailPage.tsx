

// src/app/events/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { eventQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Event, EventRSVP } from '@/lib/types'
import { format, isFuture } from 'date-fns'
import toast from 'react-hot-toast'

export default function EventDetailPage() {
  const { id = '' } = useParams()
  const { dbUser } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [myRsvp, setMyRsvp] = useState<EventRSVP | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRsvping, setIsRsvping] = useState(false)

  useEffect(() => { if (id) loadEvent() }, [id])

  const loadEvent = async () => {
    setIsLoading(true)
    const data = await eventQueries.getEventById(id)
    setEvent(data)
    if (dbUser?.id && data) {
      const rsvp = await eventQueries.getUserRsvp(id, dbUser.id)
      setMyRsvp(rsvp)
    }
    setIsLoading(false)
  }

  const handleRsvp = async (status: 'attending' | 'not_attending') => {
    if (!dbUser?.id || !event) return
    setIsRsvping(true)
    try {
      await eventQueries.rsvpEvent(event.id, dbUser.id, status)
      setMyRsvp({ id: crypto.randomUUID(), event_id: event.id, user_id: dbUser.id, status, rsvped_at: new Date().toISOString(), created_at: new Date().toISOString() } as EventRSVP)
      toast.success(status === 'attending' ? "You're attending! 🎉" : "RSVP updated.")
    } catch {
      toast.error('Failed to update RSVP.')
    } finally {
      setIsRsvping(false)
    }
  }

  const EVENT_TYPE_LABELS: Record<string, string> = {
    alumni_meetup: '🤝 Alumni Meetup',
    seminar: '🎤 Seminar',
    workshop: '🛠️ Workshop',
    career_fair: '💼 Career Fair',
    get_together: '🎉 Get Together',
    webinar: '💻 Webinar',
    other: '📅 Event',
  }

  if (isLoading) {
    return <DashboardLayout><div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4"><div className="skeleton h-8 w-48 rounded-xl" /><div className="skeleton h-80 rounded-2xl" /></div></DashboardLayout>
  }

  if (!event) {
    return <DashboardLayout><div className="p-6 text-center"><h2 className="font-semibold text-xl">Event not found</h2><Link to="/events" className="text-blue-600 text-sm mt-2 inline-block">← Back to Events</Link></div></DashboardLayout>
  }

  const isUpcoming = isFuture(new Date(event.event_date))
  const rsvps = (event as Event & { rsvps?: (EventRSVP & { user?: { id: string; full_name: string; profile_picture_url?: string } })[] }).rsvps || []
  const attendingCount = rsvps.filter(r => r.status === 'attending').length
  const isFull = event.max_attendees ? attendingCount >= event.max_attendees : false

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Link to="/events" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                  </span>
                  {!isUpcoming && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 rounded-full">Past Event</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h1>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>

            {/* Attendees */}
            {rsvps.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Attendees ({attendingCount})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {rsvps.filter(r => r.status === 'attending').map(rsvp => (
                    rsvp.user && (
                      <Link key={rsvp.id} to={`/profile/${rsvp.user_id}`} className="flex items-center gap-2 p-2 rounded-xl border border-border hover:bg-accent transition-colors">
                        <Avatar name={rsvp.user.full_name} imageUrl={rsvp.user.profile_picture_url} size="sm" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{rsvp.user.full_name.split(' ')[0]}</span>
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* RSVP Card */}
            {isUpcoming && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">RSVP for this Event</h3>

                {myRsvp?.status === 'attending' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-4 h-4" /> You&apos;re attending!
                    </div>
                    <button
                      onClick={() => handleRsvp('not_attending')}
                      disabled={isRsvping}
                      className="w-full py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-accent transition-colors text-muted-foreground"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : isFull ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 text-center">
                    This event is full ({event.max_attendees} max)
                  </div>
                ) : (
                  <button
                    onClick={() => handleRsvp('attending')}
                    disabled={isRsvping}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isRsvping ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    RSVP — I&apos;ll Attend
                  </button>
                )}
              </div>
            )}

            {/* Event Info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Event Details</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{format(new Date(event.event_date), 'h:mm a')}</div>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{event.location}</span>
                  </div>
                )}
                {event.online_link && (
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <a href={event.online_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 truncate">
                      Join Online
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {attendingCount} attending{event.max_attendees ? ` / ${event.max_attendees} max` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
