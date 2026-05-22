import type { IncomingMessage } from 'http'
import { firebaseAdmin } from './firebaseAdmin'
import { supabaseAdmin } from './supabaseAdmin'

export interface AuthContext {
  firebaseUid: string
  dbUser: {
    id: string
    role: string
    email: string
    full_name: string
  }
}

const getToken = (req: IncomingMessage) => {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '').trim()
}

export const requireUser = async (req: IncomingMessage): Promise<AuthContext> => {
  const token = getToken(req)
  if (!token) throw new Error('Missing Authorization token')

  const decoded = await firebaseAdmin.auth().verifyIdToken(token)
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, role, email, full_name')
    .eq('firebase_uid', decoded.uid)
    .single()

  if (error || !data) {
    throw new Error('User not found')
  }

  return {
    firebaseUid: decoded.uid,
    dbUser: data,
  }
}

export const requireAdmin = async (req: IncomingMessage, allowSubAdmin = true): Promise<AuthContext> => {
  const ctx = await requireUser(req)
  const isSuperAdmin = ctx.dbUser.role === 'super_admin'
  const isSubAdmin = allowSubAdmin && ctx.dbUser.role === 'sub_admin'
  if (!isSuperAdmin && !isSubAdmin) {
    throw new Error('Admin access required')
  }
  return ctx
}
