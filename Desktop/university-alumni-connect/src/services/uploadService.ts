// src/services/uploadService.ts
// Uses Supabase Storage directly — no backend API needed.

import { supabase } from '@/lib/supabase/client'

function generateFileName(file: File, prefix = 'file'): string {
  const ext = file.name.split('.').pop() || 'bin'
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}

export const uploadService = {
  /**
   * Upload avatar to Supabase Storage `avatars` bucket.
   * Returns the public URL and storage path.
   */
  async uploadAvatar(file: File): Promise<{ url: string; path: string }> {
    const fileName = generateFileName(file, 'avatar')
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) throw new Error(`Avatar upload failed: ${error.message}`)

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
    return { url: urlData.publicUrl, path: data.path }
  },

  /**
   * Upload resume to Supabase Storage `resumes` bucket (private).
   * Returns the storage path (not a public URL — use getResumeUrl to get a signed URL).
   */
  async uploadResume(file: File): Promise<{ path: string }> {
    const fileName = generateFileName(file, 'resume')
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) throw new Error(`Resume upload failed: ${error.message}`)
    return { path: data.path }
  },

  /**
   * Get a signed (temporary) URL for a private resume.
   */
  async getResumeUrl(path: string): Promise<{ url: string }> {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(path, 60 * 60) // 1-hour expiry

    if (error) throw new Error(`Failed to get resume URL: ${error.message}`)
    return { url: data.signedUrl }
  },

  /**
   * Upload community media to `community-media` bucket (public).
   */
  async uploadCommunityMedia(file: File): Promise<{ url: string; path: string }> {
    const fileName = generateFileName(file, 'media')
    const { data, error } = await supabase.storage
      .from('community-media')
      .upload(fileName, file, { upsert: true, contentType: file.type })

    if (error) throw new Error(`Media upload failed: ${error.message}`)

    const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(data.path)
    return { url: urlData.publicUrl, path: data.path }
  },
}
