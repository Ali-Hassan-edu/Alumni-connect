// src/lib/utils/index.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'

// ============================================================
// Tailwind class merger
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// Date utilities
// ============================================================

export function timeAgo(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true })
}

export function formatDate(date: string, fmt = 'MMM dd, yyyy'): string {
  return format(parseISO(date), fmt)
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'MMM dd, yyyy • h:mm a')
}

// ============================================================
// String utilities
// ============================================================

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ============================================================
// Role utilities
// ============================================================

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    alumni: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  return colors[role] || 'bg-gray-100 text-gray-700'
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blocked: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority] || 'bg-gray-100 text-gray-600'
}

export function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100'
}

export function getPostTypeIcon(postType: string): string {
  const icons: Record<string, string> = {
    discussion: '💬',
    question: '❓',
    opportunity: '💡',
    internship: '🏢',
    job: '💼',
    announcement: '📢',
  }
  return icons[postType] || '📝'
}

export function getPostTypeColor(postType: string): string {
  const colors: Record<string, string> = {
    discussion: 'bg-blue-100 text-blue-700',
    question: 'bg-purple-100 text-purple-700',
    opportunity: 'bg-emerald-100 text-emerald-700',
    internship: 'bg-teal-100 text-teal-700',
    job: 'bg-indigo-100 text-indigo-700',
    announcement: 'bg-orange-100 text-orange-700',
  }
  return colors[postType] || 'bg-gray-100 text-gray-700'
}

// ============================================================
// File utilities
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼️'
  if (type.includes('zip') || type.includes('tar')) return '🗜️'
  if (type.includes('doc')) return '📝'
  return '📎'
}

// ============================================================
// Skill matching
// ============================================================

export function matchScore(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 0
  const matched = studentSkills.filter(s =>
    requiredSkills.some(r => r.toLowerCase() === s.toLowerCase())
  )
  return Math.round((matched.length / requiredSkills.length) * 100)
}

// ============================================================
// Pagination
// ============================================================

export function getPaginationRange(current: number, total: number): number[] {
  const range: number[] = []
  const delta = 2
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  if (current - delta > 2) range.unshift(-1) // ellipsis
  if (current + delta < total - 1) range.push(-1) // ellipsis
  range.unshift(1)
  if (total > 1) range.push(total)
  return [...new Set(range)]
}
