import { getIdToken } from '@/lib/firebase/auth'

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorBody.error || 'Request failed')
  }

  return res.json() as Promise<T>
}
