import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireAdmin(req) // Allows super_admin or sub_admin
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { action, entity_type, entity_id, metadata } = payload || {}

    if (!action || !entity_type || !entity_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data, error } = await supabaseAdmin.from('activity_logs').insert({
      actor_id: dbUser.id,
      action,
      entity_type,
      entity_id,
      metadata: metadata || null,
    }).select().single()

    if (error) throw error

    return res.status(201).json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log activity'
    return res.status(400).json({ error: message })
  }
}
