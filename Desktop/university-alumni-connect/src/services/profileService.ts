// src/services/profileService.ts
// Uses Supabase directly — no backend API needed.

import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'

export interface ProfileUpdatePayload {
  full_name: string
  phone?: string
  department_id?: string
  linkedin_url?: string
  short_bio?: string
  profile_picture_url?: string
  batch?: string
  skills: string[]
  experience?: string
  portfolio_url?: string
  github_url?: string
  resume_url?: string
  // Alumni fields
  current_company?: string
  job_title?: string
  // Student fields
  interests?: string[]
  semester?: number
  cgpa?: number
}

export const profileService = {
  async updateProfile(payload: ProfileUpdatePayload): Promise<void> {
    const { dbUser } = useAuthStore.getState()
    if (!dbUser?.id) throw new Error('Not authenticated')

    const userId = dbUser.id

    // 1. Update users table (basic info)
    const userUpdates: Record<string, unknown> = {
      full_name: payload.full_name,
      updated_at: new Date().toISOString(),
    }
    if (payload.phone !== undefined) userUpdates.phone = payload.phone
    if (payload.department_id !== undefined) userUpdates.department_id = payload.department_id || null
    if (payload.linkedin_url !== undefined) userUpdates.linkedin_url = payload.linkedin_url || null
    if (payload.short_bio !== undefined) userUpdates.short_bio = payload.short_bio || null
    if (payload.profile_picture_url !== undefined) userUpdates.profile_picture_url = payload.profile_picture_url

    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId)
    if (userError) throw new Error(`Failed to update user: ${userError.message}`)

    // 2. Upsert profiles table (extended info)
    const profileData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
      skills: payload.skills ?? [],
    }
    if (payload.phone !== undefined) profileData.phone = payload.phone || null
    if (payload.department_id !== undefined) profileData.department_id = payload.department_id || null
    if (payload.batch !== undefined) profileData.batch = payload.batch || null
    if (payload.short_bio !== undefined) profileData.bio = payload.short_bio || null
    if (payload.experience !== undefined) profileData.experience = payload.experience || null
    if (payload.portfolio_url !== undefined) profileData.portfolio_url = payload.portfolio_url || null
    if (payload.linkedin_url !== undefined) profileData.linkedin_url = payload.linkedin_url || null
    if (payload.github_url !== undefined) profileData.github_url = payload.github_url || null
    if (payload.resume_url !== undefined) profileData.resume_url = payload.resume_url || null
    if (payload.profile_picture_url !== undefined) profileData.avatar_url = payload.profile_picture_url

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
    if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`)

    // 3. Upsert role-specific profile
    const role = dbUser.role
    if (role === 'alumni') {
      const alumniData: Record<string, unknown> = { user_id: userId, skills: payload.skills ?? [] }
      if (payload.current_company !== undefined) alumniData.current_company = payload.current_company || null
      if (payload.job_title !== undefined) alumniData.job_title = payload.job_title || null

      const { error } = await supabase
        .from('alumni_profiles')
        .upsert(alumniData, { onConflict: 'user_id' })
      if (error) throw new Error(`Failed to update alumni profile: ${error.message}`)
    } else if (role === 'student') {
      const studentData: Record<string, unknown> = {
        user_id: userId,
        skills: payload.skills ?? [],
        interests: payload.interests ?? [],
      }
      if (payload.semester !== undefined) studentData.semester = payload.semester
      if (payload.cgpa !== undefined) studentData.cgpa = payload.cgpa
      if (payload.github_url !== undefined) studentData.github_url = payload.github_url || null
      if (payload.portfolio_url !== undefined) studentData.portfolio_url = payload.portfolio_url || null
      if (payload.resume_url !== undefined) studentData.resume_url = payload.resume_url || null

      const { error } = await supabase
        .from('student_profiles')
        .upsert(studentData, { onConflict: 'user_id' })
      if (error) throw new Error(`Failed to update student profile: ${error.message}`)
    }

    // 4. Refresh dbUser in store so UI updates immediately
    const { data: refreshed } = await supabase
      .from('users')
      .select('*, department:departments(*), profile:profiles(*)')
      .eq('id', userId)
      .single()
    if (refreshed) {
      useAuthStore.getState().setDbUser(refreshed)
    }
  },
}
