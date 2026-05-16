

// src/app/notifications/page.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, CheckCheck, MessageSquare, Briefcase, Calendar,
  UserCheck, Star, ChevronRight
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Notification } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

const NOTIFICATION_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  account_approved: { icon: UserCheck, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  account_rejected: { icon: UserCheck, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  task_uploaded: { icon: Briefcase, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  task_assigned: { icon: Briefcase, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  task_submitted: { icon: Briefcase, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  task_approved: { icon: Star, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  event: { icon: Calendar, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  reply: { icon: MessageSquare, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  announcement: { icon: Bell, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
}

function NotificationItem({ notification }: { notification: Notification }) {
  const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.announcement
  const Icon = config.icon

  const content = (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
      !notification.is_read
        ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10'
        : 'border-border bg-card hover:bg-accent/30'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{notification.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
          </div>
          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {notification.link && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />}
    </div>
  )

  if (notification.link) {
    return <Link to={notification.link}>{content}</Link>
  }
  return content
}

export default function NotificationsPage() {
  const { dbUser } = useAuthStore()
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllRead } = useNotificationStore()

  useEffect(() => {
    if (dbUser?.id) fetchNotifications(dbUser.id)
  }, [dbUser?.id])

  const handleMarkAllRead = async () => {
    if (!dbUser?.id) return
    await markAllRead(dbUser.id)
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No notifications yet</h3>
            <p className="text-muted-foreground text-sm">
              You&apos;ll receive notifications for account approvals, task assignments, event announcements, and community activity.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unread first */}
            {notifications.filter(n => !n.is_read).length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">New</h2>
                <div className="space-y-2">
                  {notifications.filter(n => !n.is_read).map(n => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </div>
            )}
            {notifications.filter(n => n.is_read).length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 mt-4">Earlier</h2>
                <div className="space-y-2">
                  {notifications.filter(n => n.is_read).map(n => <NotificationItem key={n.id} notification={n} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
