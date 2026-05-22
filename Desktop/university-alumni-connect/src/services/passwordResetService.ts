// src/services/passwordResetService.ts
// Uses Supabase directly — no backend API needed.
// Uses FK hint syntax for password_reset_requests (two FKs to users).

import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export const passwordResetService = {
  /**
   * Student submits a password reset request.
   * Works even when logged out (email-only lookup).
   */
  async createRequest(email: string, message?: string) {
    // Look up user by email to get user_id (if exists)
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    const { data, error } = await supabase
      .from('password_reset_requests')
      .insert({
        email,
        user_id: user?.id || null,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to submit request: ${error.message}`)
    return { data }
  },

  /**
   * Admin fetches all password reset requests.
   * Uses FK hint "!password_reset_requests_user_id_fkey" to avoid ambiguous
   * relationship error (table has both user_id and admin_id FK to users).
   */
  async fetchRequests() {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*, user:users!password_reset_requests_user_id_fkey(id, full_name, email, role)')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch requests: ${error.message}`)
    return { data: data || [] }
  },

  /**
   * Admin resolves or rejects a password reset request.
   */
  async resolveRequest(payload: {
    requestId: string
    action: 'resolved' | 'rejected'
    tempPassword?: string
    adminNotes?: string
  }) {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    const updates: Record<string, unknown> = {
      status: payload.action,
      admin_id: dbUser.id,
      admin_notes: payload.adminNotes || null,
      updated_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    }

    if (payload.tempPassword && payload.action === 'resolved') {
      updates.temp_password_sent_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('password_reset_requests')
      .update(updates)
      .eq('id', payload.requestId)
      .select('*, user:users!password_reset_requests_user_id_fkey(id, full_name, email)')
      .single()

    if (error) throw new Error(`Failed to resolve request: ${error.message}`)

    // Notify the user
    try {
      const req = data as { user_id: string; email: string }
      if (req?.user_id) {
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          type: 'password_reset_handled',
          title: payload.action === 'resolved' ? '🔑 Password Reset Handled' : '❌ Password Reset Rejected',
          message:
            payload.action === 'resolved'
              ? `Your password reset request has been handled.${payload.tempPassword ? ` Temporary password: ${payload.tempPassword}` : ' Please contact admin for your new password.'}`
              : `Your password reset request was rejected.${payload.adminNotes ? ` Note: ${payload.adminNotes}` : ''}`,
          is_read: false,
        })
      }
    } catch {
      // Don't fail if notification fails
    }

    return { data }
  },
}
