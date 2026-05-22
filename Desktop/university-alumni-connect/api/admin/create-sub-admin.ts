// api/admin/create-sub-admin.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_utils/auth'
import { firebaseAdmin } from '../_utils/firebaseAdmin'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Only allow super_admin to create sub_admins (allowSubAdmin = false)
    const { dbUser } = await requireAdmin(req, false)
    if (dbUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only Super Admins can perform this action' })
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { email, password, full_name, registration_number, batch } = payload || {}

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' })
    }

    // 1. Create the user in Firebase Auth
    const fbUser = await firebaseAdmin.auth().createUser({
      email,
      password,
      displayName: full_name,
      emailVerified: true,
    })

    // 2. Insert user into Supabase users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        full_name,
        role: 'sub_admin',
        account_status: 'approved',
        firebase_uid: fbUser.uid,
        registration_number: registration_number || `SA-${Math.floor(1000 + Math.random() * 9000)}`,
      })
      .select()
      .single()

    if (userError) {
      // Cleanup firebase user if DB insert fails
      await firebaseAdmin.auth().deleteUser(fbUser.uid)
      throw userError
    }

    // 3. Create user profile in Supabase profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.id,
        batch: batch || new Date().getFullYear().toString(),
      })

    if (profileError) {
      // Cleanup if profile fails
      await supabaseAdmin.from('users').delete().eq('id', newUser.id)
      await firebaseAdmin.auth().deleteUser(fbUser.uid)
      throw profileError
    }

    // 4. Log Activity
    await supabaseAdmin.from('activity_logs').insert({
      actor_id: dbUser.id,
      action: 'sub_admin_created',
      entity_type: 'user',
      entity_id: newUser.id,
      metadata: { email: newUser.email, full_name: newUser.full_name },
    })

    return res.status(201).json({
      message: 'Sub-Admin created successfully',
      data: newUser,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sub-admin'
    return res.status(400).json({ error: message })
  }
}
