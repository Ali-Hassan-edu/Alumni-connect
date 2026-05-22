import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireUser(req)
    const path = (req.query.path as string) || ''
    if (!path.startsWith(`${dbUser.id}/`)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('resumes')
      .createSignedUrl(path, 60 * 10)
    if (error) throw error

    return res.status(200).json({ url: data.signedUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create signed URL'
    return res.status(400).json({ error: message })
  }
}
