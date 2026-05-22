// src/services/adminService.ts
// Uses Supabase directly — no backend API needed.

import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export const adminService = {
  /**
   * Create a sub-admin user record.
   * Note: actual Firebase auth account creation must be done via the admin SDK or
   * by having the new user sign up normally then being promoted here.
   * This function creates/updates the users table record with sub_admin role.
   */
  async createSubAdmin(payload: {
    email: string
    password?: string
    full_name: string
    registration_number?: string
    batch?: string
  }) {
    // Check if user already exists in users table
    const { data: existing } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', payload.email)
      .maybeSingle()

    if (existing) {
      // Promote existing user to sub_admin
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'sub_admin', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error(`Failed to promote user: ${error.message}`)
      return { message: 'User promoted to sub-admin', data }
    }

    // Insert new user record (they'll need to sign up with Firebase separately)
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: payload.email,
        full_name: payload.full_name,
        role: 'sub_admin',
        account_status: 'approved',
        registration_number: payload.registration_number || `SA-${Date.now()}`,
        firebase_uid: `pending-${Date.now()}`,
        is_email_verified: false,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create sub-admin: ${error.message}`)
    return { message: 'Sub-admin record created. Ask them to sign up with this email.', data }
  },

  /**
   * Log an activity to activity_logs table.
   */
  async logActivity(payload: {
    action: string
    entity_type: string
    entity_id: string
    metadata?: Record<string, unknown>
  }) {
    const { dbUser } = useAuthStore.getState()
    const { error } = await supabase.from('activity_logs').insert({
      admin_id: dbUser?.id || null,
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      metadata: payload.metadata || {},
    })
    if (error) console.error('Failed to log activity:', error.message)
    return { data: null }
  },

  /**
   * Log a signup event (non-critical, silently fails).
   */
  async logSignup(metadata?: Record<string, unknown>) {
    try {
      await supabase.from('activity_logs').insert({
        admin_id: null,
        action: 'user_signup',
        entity_type: 'user',
        entity_id: 'new',
        metadata: metadata || {},
      })
    } catch {
      // non-critical
    }
    return { ok: true }
  },
}
