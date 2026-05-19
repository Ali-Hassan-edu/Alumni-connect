import { Pin, Megaphone, Clock } from 'lucide-react'
import type { Announcement } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const priorityStyle = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.medium
  const isExpired = announcement.expires_at ? new Date(announcement.expires_at) < new Date() : false

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
            <Megaphone className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1">
              {announcement.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {announcement.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${priorityStyle}`}>
            {announcement.priority}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">{announcement.content}</p>

  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
    {announcement.occurs_at && (
      <div>Occurs {formatDistanceToNow(new Date(announcement.occurs_at), { addSuffix: true })}</div>
    )}
    {announcement.expires_at && (
      <div>
        {isExpired ? (
          <span className="text-red-500 font-medium">Expired</span>
        ) : (
          <>Expires {formatDistanceToNow(new Date(announcement.expires_at), { addSuffix: true })}</>
        )}
      </div>
    )}
  </div>
    </div>
  )
}
