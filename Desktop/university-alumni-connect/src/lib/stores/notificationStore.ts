// src/lib/stores/notificationStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { notificationQueries } from '@/lib/supabase/queries'
import type { Notification } from '@/lib/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: (userId: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  addNotification: (notification: Notification) => void
  subscribeToRealtime: (userId: string) => void
  unsubscribe: () => void
}

let channel: ReturnType<typeof supabase.channel> | null = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true })
    const data = await notificationQueries.getNotifications(userId)
    set({
      notifications: data,
      unreadCount: data.filter(n => !n.is_read).length,
      isLoading: false,
    })
  },

  markAllRead: async (userId: string) => {
    await notificationQueries.markAllRead(userId)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },

  subscribeToRealtime: (userId: string) => {
    if (channel) supabase.removeChannel(channel)
    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as Notification
          get().addNotification(newNotification)
        }
      )
      .subscribe()
  },

  unsubscribe: () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  },
}))
