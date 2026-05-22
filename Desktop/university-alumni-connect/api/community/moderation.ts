import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireAdmin(req)

    if (req.method === 'GET') {
      const status = (req.query.status as string) || 'pending'
      const { data, error } = await supabaseAdmin
        .from('community_posts')
        .select('*, author:users!community_posts_author_id_fkey(id, full_name, email, profile_picture_url, role)')
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ data })
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { postId, action, reason } = payload || {}
    if (!postId || !action) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const updates = action === 'approved'
      ? { status: 'approved', approved_at: new Date().toISOString(), approved_by: dbUser.id, rejection_reason: null }
      : { status: 'rejected', rejection_reason: reason || 'Not specified' }

    const { data: post, error: updateError } = await supabaseAdmin
      .from('community_posts')
      .update(updates)
      .eq('id', postId)
      .select('*, author:users!community_posts_author_id_fkey(id, full_name)')
      .single()
    if (updateError) throw updateError

    await supabaseAdmin.from('post_approvals').insert({
      post_id: postId,
      action,
      reason: reason || null,
      acted_by: dbUser.id,
    })

    await supabaseAdmin.from('notifications').insert({
      user_id: post.author_id,
      type: action === 'approved' ? 'post_approved' : 'post_rejected',
      title: action === 'approved' ? 'Post Approved' : 'Post Rejected',
      message: action === 'approved'
        ? 'Your community post has been approved and is now public.'
        : `Your community post was rejected. ${reason ? `Reason: ${reason}` : ''}`,
      link: action === 'approved' ? `/community/${post.id}` : '/community',
    })

    await supabaseAdmin.from('activity_logs').insert({
      actor_id: dbUser.id,
      action: `post_${action}`,
      entity_type: 'community_post',
      entity_id: postId,
      metadata: { reason: reason || null },
    })

    return res.status(200).json({ data: post })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Moderation failed'
    return res.status(400).json({ error: message })
  }
}
