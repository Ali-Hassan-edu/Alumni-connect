// src/services/communityService.ts
// Uses Supabase directly — no backend API needed.
// Uses FK hint syntax to resolve ambiguous PostgREST relationships.

import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export interface CreateCommunityPostPayload {
  title: string
  content: string
  post_type: string
  tags: string[]
}

export const communityService = {
  /**
   * Create a community post.
   * Posts from non-admins go to `pending` status and need admin approval.
   */
  async createPost(payload: CreateCommunityPostPayload) {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    const isAdmin = dbUser.role === 'super_admin' || dbUser.role === 'sub_admin'
    const status = isAdmin ? 'approved' : 'pending'

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        title: payload.title,
        content: payload.content,
        post_type: payload.post_type,
        tags: payload.tags,
        author_id: dbUser.id,
        status,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create post: ${error.message}`)
    return { data }
  },

  /**
   * Get posts from moderation queue by status.
   * Uses FK hint "!community_posts_author_id_fkey" to avoid ambiguous
   * relationship error (community_posts has two FKs to users).
   */
  async getModerationQueue(status: 'pending' | 'approved' | 'rejected' = 'pending') {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, author:users!community_posts_author_id_fkey(id, full_name, profile_picture_url, role, email)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to get moderation queue: ${error.message}`)
    return { data: data || [] }
  },

  /**
   * Approve or reject a post (admin action).
   */
  async moderatePost(payload: {
    postId: string
    action: 'approved' | 'rejected'
    reason?: string
  }) {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    // Update post status
    const { data, error } = await supabase
      .from('community_posts')
      .update({
        status: payload.action,
        approved_by: dbUser.id,
        approved_at: new Date().toISOString(),
        rejection_reason: payload.action === 'rejected' ? (payload.reason || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.postId)
      .select('*, author:users!community_posts_author_id_fkey(id, full_name, email)')
      .single()

    if (error) throw new Error(`Failed to moderate post: ${error.message}`)

    // Insert approval record
    await supabase.from('post_approvals').upsert(
      {
        post_id: payload.postId,
        acted_by: dbUser.id,
        action: payload.action,
        reason: payload.reason || null,
        acted_at: new Date().toISOString(),
      },
      { onConflict: 'post_id' }
    )

    // Notify the post author
    try {
      const post = data as { author_id: string; title: string }
      if (post?.author_id) {
        await supabase.from('notifications').insert({
          user_id: post.author_id,
          type: payload.action === 'approved' ? 'post_approved' : 'post_rejected',
          title: payload.action === 'approved' ? '✅ Post Approved' : '❌ Post Rejected',
          message:
            payload.action === 'approved'
              ? `Your post "${post.title}" has been approved and is now visible.`
              : `Your post "${post.title}" was rejected. ${payload.reason ? `Reason: ${payload.reason}` : ''}`,
          link: payload.action === 'approved' ? `/community/${payload.postId}` : '/community',
          is_read: false,
        })
      }
    } catch {
      // Don't fail moderation if notification fails
    }

    return { data }
  },

  /**
   * Add a comment to a post.
   */
  async addComment(payload: {
    postId: string
    content: string
    parent_comment_id?: string
  }) {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: payload.postId,
        author_id: dbUser.id,
        content: payload.content,
        parent_comment_id: payload.parent_comment_id || null,
      })
      .select('*, author:users!comments_author_id_fkey(id, full_name, profile_picture_url, role)')
      .single()

    if (error) throw new Error(`Failed to add comment: ${error.message}`)
    return { data }
  },

  /**
   * Toggle like on a post or comment.
   */
  async toggleLike(payload: { postId?: string; commentId?: string }) {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    // Check for existing like
    let query = supabase.from('likes').select('id').eq('user_id', dbUser.id)
    if (payload.postId) query = query.eq('post_id', payload.postId)
    if (payload.commentId) query = query.eq('comment_id', payload.commentId)

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id)
      return { status: 'unliked' }
    } else {
      await supabase.from('likes').insert({
        user_id: dbUser.id,
        post_id: payload.postId || null,
        comment_id: payload.commentId || null,
      })
      return { status: 'liked' }
    }
  },
}
