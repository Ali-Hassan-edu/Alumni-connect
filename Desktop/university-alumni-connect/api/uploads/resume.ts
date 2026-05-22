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
    const allowedMimeTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF and Word documents (.doc, .docx) are allowed.' })
    }

    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    if (file.buffer.length > maxSizeBytes) {
      return res.status(400).json({ error: 'File size too large. Resume documents must be under 5MB.' })
    }

    const ext = path.extname(file.originalFilename) || '.pdf'
    const filePath = `${dbUser.id}/${Date.now()}${ext}`

    const { error } = await supabaseAdmin.storage
      .from('resumes')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true })
    if (error) throw error

    return res.status(200).json({ path: filePath })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return res.status(400).json({ error: message })
  }
}
