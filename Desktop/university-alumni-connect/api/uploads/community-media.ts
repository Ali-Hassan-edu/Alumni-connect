import path from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireUser } from '../_utils/auth'
import { supabaseAdmin } from '../_utils/supabaseAdmin'
import { parseSingleFile } from '../_utils/upload'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dbUser } = await requireUser(req)
    const file = await parseSingleFile(req)

    // Secure validation checks
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, GIF images, and PDFs are allowed.' })
    }

    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    if (file.buffer.length > maxSizeBytes) {
      return res.status(400).json({ error: 'File size too large. Media files must be under 5MB.' })
    }

    const ext = path.extname(file.originalFilename) || '.jpg'
    const filePath = `${dbUser.id}/${Date.now()}${ext}`

    const { error } = await supabaseAdmin.storage
      .from('community-media')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true })
    if (error) throw error

    const { data } = supabaseAdmin.storage.from('community-media').getPublicUrl(filePath)
    return res.status(200).json({ url: data.publicUrl, path: filePath })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return res.status(400).json({ error: message })
  }
}
