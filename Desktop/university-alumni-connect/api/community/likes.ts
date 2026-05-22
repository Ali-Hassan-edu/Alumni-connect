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
    const { postId, commentId } = payload || {}
    if (!postId && !commentId) {
      return res.status(400).json({ error: 'Missing target' })
    }

    const likeQuery = supabaseAdmin.from('likes').select('id').eq('user_id', dbUser.id)
    if (postId) likeQuery.eq('post_id', postId)
    if (commentId) likeQuery.eq('comment_id', commentId)

    const { data: existing } = await likeQuery.maybeSingle()
    if (existing) {
      await supabaseAdmin.from('likes').delete().eq('id', existing.id)
      return res.status(200).json({ status: 'unliked' })
    }

    const { data, error } = await supabaseAdmin.from('likes').insert({
      user_id: dbUser.id,
      post_id: postId || null,
      comment_id: commentId || null,
    }).select().single()
    if (error) throw error

    if (postId) {
      const { data: post } = await supabaseAdmin
        .from('community_posts')
        .select('author_id')
        .eq('id', postId)
        .single()
      if (post?.author_id && post.author_id !== dbUser.id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: post.author_id,
          type: 'like',
          title: 'New like on your post',
          message: `${dbUser.full_name} liked your post.`,
          link: `/community/${postId}`,
        })
      }
    }

    return res.status(200).json({ status: 'liked', data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to like'
    return res.status(400).json({ error: message })
  }
}
