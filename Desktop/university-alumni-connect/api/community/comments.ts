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
    const { postId, content, parent_comment_id } = payload || {}
    if (!postId || !content) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('community_posts')
      .select('id, author_id, status')
      .eq('id', postId)
      .single()
    if (postError) throw postError
    if (post.status !== 'approved') {
      return res.status(403).json({ error: 'Post is not approved' })
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        author_id: dbUser.id,
        content,
        parent_comment_id: parent_comment_id || null,
      })
      .select('*, author:users!comments_author_id_fkey(id, full_name, profile_picture_url, role)')
      .single()
    if (error) throw error

    if (post.author_id && post.author_id !== dbUser.id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: post.author_id,
        type: 'comment',
        title: 'New comment on your post',
        message: `${dbUser.full_name} commented on your post.`,
        link: `/community/${postId}`,
      })
    }

    return res.status(200).json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to comment'
    return res.status(400).json({ error: message })
  }
}
