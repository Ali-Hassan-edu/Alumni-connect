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

    const {
      full_name,
      phone,
      department_id,
      linkedin_url,
      short_bio,
      profile_picture_url,
      batch,
      skills,
      experience,
      portfolio_url,
      github_url,
      resume_url,
      // role-specific
      current_company,
      job_title,
      interests,
      semester,
      cgpa,
    } = payload || {}

    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        full_name,
        phone,
        department_id,
        linkedin_url,
        short_bio,
        profile_picture_url,
      })
      .eq('id', dbUser.id)
      .select('*, department:departments(*)')
      .single()
    if (userError) throw userError

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: dbUser.id,
        department_id,
        batch,
        phone,
        bio: short_bio,
        skills,
        experience,
        portfolio_url,
        linkedin_url,
        github_url,
        resume_url,
        avatar_url: profile_picture_url,
      }, { onConflict: 'user_id' })
    if (profileError) throw profileError

    if (dbUser.role === 'alumni') {
      await supabaseAdmin.from('alumni_profiles').upsert({
        user_id: dbUser.id,
        skills,
        current_company: current_company || null,
        job_title: job_title || null,
      }, { onConflict: 'user_id' })
    } else {
      await supabaseAdmin.from('student_profiles').upsert({
        user_id: dbUser.id,
        skills,
        interests,
        github_url: github_url || null,
        resume_url: resume_url || null,
        portfolio_url: portfolio_url || null,
        semester,
        cgpa,
      }, { onConflict: 'user_id' })
    }

    return res.status(200).json({ data: updatedUser })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return res.status(400).json({ error: message })
  }
}
