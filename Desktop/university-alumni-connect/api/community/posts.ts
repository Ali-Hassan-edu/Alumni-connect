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
    const { title, content, post_type, tags } = payload || {}

    if (!title || !content || !post_type) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        author_id: dbUser.id,
        title,
        content,
        post_type,
        tags: Array.isArray(tags) ? tags : [],
        status: 'pending',
      })
      .select('*, author:users!community_posts_author_id_fkey(id, full_name, profile_picture_url, role)')
      .single()
    if (error) throw error

    return res.status(200).json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    return res.status(400).json({ error: message })
  }
}
