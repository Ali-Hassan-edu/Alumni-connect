import formidable, { File as FormidableFile } from 'formidable'
import type { Fields, Files } from 'formidable'
import fs from 'fs/promises'

export interface UploadedFile {
  buffer: Buffer
  originalFilename: string
  mimetype: string
}

export const parseSingleFile = async (req: any): Promise<UploadedFile> => {
  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 })

  const { files } = await new Promise<{ fields: Record<string, any>; files: Record<string, FormidableFile | FormidableFile[]> }>((resolve, reject) => {
    form.parse(req, (err: NodeJS.ErrnoException | null, fields: Fields, parsedFiles: Files) => {
      if (err) return reject(err)
      resolve({ fields, files: parsedFiles })
    })
  })

  const fileEntry = files.file
  const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry
  if (!file) {
    throw new Error('Missing file')
  }

  const buffer = await fs.readFile(file.filepath)
  return {
    buffer,
    originalFilename: file.originalFilename || 'upload',
    mimetype: file.mimetype || 'application/octet-stream',
  }
}
