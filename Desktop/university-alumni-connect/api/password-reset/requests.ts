import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin, requireUser } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.method === 'GET') {
      await requireAdmin(req)
      const { data, error } = await supabaseAdmin
        .from('password_reset_requests')
        .select('*, user:users(id, full_name, email, role)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ data })
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { message, email } = payload || {}

    let userId: string | null = null
    let userEmail = email
    try {
      const { dbUser } = await requireUser(req)
      userId = dbUser.id
      userEmail = dbUser.email
    } catch {
      if (!userEmail) {
        return res.status(400).json({ error: 'Email is required' })
      }
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle()
      userId = user?.id || null
    }

    const { data, error } = await supabaseAdmin
      .from('password_reset_requests')
      .insert({
        user_id: userId,
        email: userEmail,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single()
    if (error) throw error

    await supabaseAdmin.from('activity_logs').insert({
      actor_id: userId,
      action: 'password_reset_requested',
      entity_type: 'password_reset_request',
      entity_id: data.id,
      metadata: { email: userEmail },
    })

    return res.status(200).json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return res.status(400).json({ error: message })
  }
}
