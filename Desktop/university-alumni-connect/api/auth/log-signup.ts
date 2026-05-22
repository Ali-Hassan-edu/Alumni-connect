import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireUser(req)
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    await supabaseAdmin.from('activity_logs').insert({
      actor_id: dbUser.id,
      action: 'signup',
      entity_type: 'user',
      entity_id: dbUser.id,
      metadata: {
        email: dbUser.email,
        role: dbUser.role,
        ...(payload?.metadata || {}),
      },
    })

    return res.status(201).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log signup'
    return res.status(400).json({ error: message })
  }
}
