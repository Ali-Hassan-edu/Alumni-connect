import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'
import { firebaseAdmin } from '../_utils/firebaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireAdmin(req)
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { requestId, action, tempPassword, adminNotes } = payload || {}
    if (!requestId || !action) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: request, error: reqError } = await supabaseAdmin
      .from('password_reset_requests')
      .select('*, user:users(id, email, firebase_uid)')
      .eq('id', requestId)
      .single()
    if (reqError || !request) throw reqError || new Error('Request not found')

    if (action === 'resolved') {
      if (!tempPassword) {
        return res.status(400).json({ error: 'tempPassword is required to resolve' })
      }
      await firebaseAdmin.auth().updateUser(request.user?.firebase_uid, { password: tempPassword })
    }

    const updates = {
      status: action === 'resolved' ? 'resolved' : 'rejected',
      admin_id: dbUser.id,
      admin_notes: adminNotes || null,
      resolved_at: new Date().toISOString(),
      temp_password_sent_at: action === 'resolved' ? new Date().toISOString() : null,
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('password_reset_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()
    if (updateError) throw updateError

    await supabaseAdmin.from('notifications').insert({
      user_id: request.user?.id,
      type: 'password_reset_handled',
      title: action === 'resolved' ? 'Password Reset Approved' : 'Password Reset Rejected',
      message: action === 'resolved'
        ? `Your password has been reset. Temporary password: ${tempPassword}`
        : 'Your password reset request was rejected. Please contact admin.',
    })

    await supabaseAdmin.from('activity_logs').insert({
      actor_id: dbUser.id,
      action: `password_reset_${action}`,
      entity_type: 'password_reset_request',
      entity_id: requestId,
    })

    return res.status(200).json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resolve failed'
    return res.status(400).json({ error: message })
  }
}
