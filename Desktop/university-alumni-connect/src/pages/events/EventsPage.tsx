

// src/app/events/page.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, Clock, Search } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { eventQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Event } from '@/lib/types'
import { format, formatDistanceToNow, isFuture, isPast } from 'date-fns'

const EVENT_TYPE_CONFIG: Record<string, { color: string; emoji: string }> = {
  alumni_meetup: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', emoji: '🤝' },
  seminar: { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', emoji: '🎤' },
  workshop: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', emoji: '🛠️' },
  career_fair: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', emoji: '💼' },
  get_together: { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', emoji: '🎉' },
  webinar: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', emoji: '💻' },
  other: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', emoji: '📅' },
}

function EventCard({ event }: { event: Event }) {
  const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other
  const isUpcoming = isFuture(new Date(event.event_date))
  const rsvpCount = (event as Event & { rsvp_count?: { count: number }[] }).rsvp_count

  return (
    <Link to={`/events/${event.id}`} className="block bg-card border border-border rounded-2xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-md transition-all">
      {/* Color bar */}
      <div className={`h-1.5 ${isUpcoming ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                {config.emoji} {event.event_type.replace('_', ' ')}
              </span>
              {!isUpcoming && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full">Past</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{event.title}</h3>
          </div>
          <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800/50">
            <span className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-none">{format(new Date(event.event_date), 'dd')}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 leading-none">{format(new Date(event.event_date), 'MMM')}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy • h:mm a')}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </div>
          )}
          {rsvpCount && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {Array.isArray(rsvpCount) ? rsvpCount[0]?.count || 0 : rsvpCount} attending
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const { dbUser } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming')
  const [search, setSearch] = useState('')

  useEffect(() => { loadEvents() }, [filter])

  const loadEvents = async () => {
    setIsLoading(true)
    const data = await eventQueries.getEvents(filter === 'upcoming')
    setEvents(data)
    setIsLoading(false)
  }

  const filteredEvents = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  ).filter(e => {
    if (filter === 'past') return isPast(new Date(e.event_date))
    if (filter === 'upcoming') return isFuture(new Date(e.event_date))
    return true
  })

  const isAdmin = dbUser?.role === 'super_admin'

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
            <p className="text-muted-foreground text-sm">University meetups, workshops, and more</p>
          </div>
          {isAdmin && (
            <Link to="/events/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="inline-flex rounded-xl border border-border p-1 bg-muted/50">
            {(['upcoming', 'all', 'past'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === f ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'upcoming' ? 'No upcoming events scheduled.' : 'No events match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
