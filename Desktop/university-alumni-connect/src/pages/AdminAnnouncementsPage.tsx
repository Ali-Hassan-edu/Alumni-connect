import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Edit2, Trash2, Pin, PinOff, X, AlertCircle, Loader, Bell, Megaphone
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { announcementQueries } from '@/lib/supabase/queries'
import type { Announcement, AnnouncementPriority } from '@/lib/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ============================================================
// Validation Schema
// ============================================================

const announcementFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content must be less than 5000 characters'),
  priority: z.enum(['low', 'medium', 'high'] as const, { errorMap: () => ({ message: 'Select a valid priority' }) }),
  is_pinned: z.boolean().default(false),
  expires_at: z.string().optional().or(z.literal('')),
})

type AnnouncementFormData = z.infer<typeof announcementFormSchema>

// ============================================================
// Components
// ============================================================

function PriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  const styles = {
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }
  const labels = { low: 'Low', medium: 'Medium', high: 'High' }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}

function AnnouncementForm({
  onSubmit,
  onCancel,
  isLoading,
  editingAnnouncement,
}: {
  onSubmit: (data: AnnouncementFormData) => void
  onCancel: () => void
  isLoading: boolean
  editingAnnouncement?: Announcement | null
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: editingAnnouncement ? {
      title: editingAnnouncement.title,
      content: editingAnnouncement.content,
      priority: editingAnnouncement.priority,
      is_pinned: editingAnnouncement.is_pinned,
      expires_at: editingAnnouncement.expires_at || '',
    } : {
      priority: 'medium',
      is_pinned: false,
      expires_at: '',
    },
  })

  useEffect(() => {
    if (editingAnnouncement) {
      reset({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        priority: editingAnnouncement.priority,
        is_pinned: editingAnnouncement.is_pinned,
        expires_at: editingAnnouncement.expires_at || '',
      })
    }
  }, [editingAnnouncement, reset])

  const isPinned = watch('is_pinned')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card dark:bg-slate-800 p-6 rounded-xl border border-border">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          type="text"
          placeholder="Announcement title"
          className="w-full px-4 py-2 rounded-lg border border-input bg-background dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('content')}
          placeholder="Announcement content..."
          rows={6}
          className="w-full px-4 py-2 rounded-lg border border-input bg-background dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
      </div>

      {/* Grid: Priority & Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            {...register('priority')}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Expires At (Optional)
          </label>
          <input
            {...register('expires_at')}
            type="datetime-local"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {errors.expires_at && <p className="text-red-500 text-sm mt-1">{errors.expires_at.message}</p>}
        </div>
      </div>

      {/* Pin Toggle */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-border">
        <input
          {...register('is_pinned')}
          type="checkbox"
          id="is_pinned"
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="is_pinned" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1">
          Pin this announcement
        </label>
        {isPinned && <Pin className="w-4 h-4 text-blue-600" />}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg border border-border bg-background dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {editingAnnouncement ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onPin,
}: {
  announcement: Announcement
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
  onPin: (id: string, isPinned: boolean) => void
}) {
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      announcement.is_pinned
        ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10'
        : 'border-border bg-card dark:bg-slate-800'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {announcement.is_pinned && <Pin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 break-words">
              {announcement.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={announcement.priority} />
            {isExpired && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <AlertCircle className="w-3 h-3" />
                Expired
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onPin(announcement.id, !announcement.is_pinned)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title={announcement.is_pinned ? 'Unpin' : 'Pin'}
          >
            {announcement.is_pinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(announcement)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(announcement.id)}
            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words line-clamp-3">
        {announcement.content}
      </p>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {announcement.admin?.full_name && (
            <span>By {announcement.admin.full_name}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Created: {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
          {announcement.expires_at && (
            <div>Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy h:mm a')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmationModal({
  isOpen,
  announcementTitle,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean
  announcementTitle: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Announcement</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete "<strong>{announcementTitle}</strong>"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-border bg-background dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export function AdminAnnouncementsPage() {
  const navigate = useNavigate()
  const { dbUser } = useAuthStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view')
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  })

  // Check admin access
  useEffect(() => {
    if (dbUser?.role !== 'super_admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
    }
  }, [dbUser, navigate])

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setIsLoading(true)
        const data = await announcementQueries.getAnnouncements(true)
        setAnnouncements(data)
      } catch (error) {
        console.error('Failed to load announcements:', error)
        toast.error('Failed to load announcements')
      } finally {
        setIsLoading(false)
      }
    }

    if (dbUser?.role === 'super_admin') {
      loadAnnouncements()
    }
  }, [dbUser])

  // Handle form submission
  const handleFormSubmit = async (data: AnnouncementFormData) => {
    if (!dbUser?.id) return

    try {
      setIsSaving(true)

      const announcementData = {
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
        admin_id: dbUser.id,
      }

      if (editingAnnouncement) {
        await announcementQueries.updateAnnouncement(editingAnnouncement.id, announcementData)
        toast.success('Announcement updated!')
      } else {
        await announcementQueries.createAnnouncement(announcementData)
        toast.success('Announcement created!')
      }

      // Reload announcements
      const updated = await announcementQueries.getAnnouncements(true)
      setAnnouncements(updated)

      // Reset form
      setEditingAnnouncement(null)
      setActiveTab('view')
    } catch (error) {
      console.error('Failed to save announcement:', error)
      toast.error('Failed to save announcement')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle edit
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setActiveTab('create')
  }

  // Handle delete
  const handleDeleteClick = (id: string) => {
    const announcement = announcements.find(a => a.id === id)
    setDeleteConfirm({
      isOpen: true,
      id,
      title: announcement?.title || 'this announcement',
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsSaving(true)
      await announcementQueries.deleteAnnouncement(deleteConfirm.id)
      toast.success('Announcement deleted!')

      const updated = await announcementQueries.getAnnouncements(true)
      setAnnouncements(updated)
      setDeleteConfirm({ isOpen: false, id: '', title: '' })
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      toast.error('Failed to delete announcement')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle pin/unpin
  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      await announcementQueries.togglePin(id, isPinned)
      const updated = await announcementQueries.getAnnouncements(true)
      setAnnouncements(updated)
      toast.success(isPinned ? 'Announcement pinned!' : 'Announcement unpinned!')
    } catch (error) {
      console.error('Failed to update pin status:', error)
      toast.error('Failed to update announcement')
    }
  }

  if (!dbUser || dbUser.role !== 'super_admin') {
    return null
  }

  const pinnedCount = announcements.filter(a => a.is_pinned).length
  const expiredCount = announcements.filter(a => a.expires_at && new Date(a.expires_at) < new Date()).length

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    Announcements
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Manage and publish announcements to the alumni community</p>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{announcements.length}</div>
                  <div className="text-xs text-muted-foreground">Total Announcements</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-border">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{announcements.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-border">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{pinnedCount}</div>
                <div className="text-xs text-muted-foreground">Pinned</div>
              </div>
              <div className="px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-border">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {announcements.filter(a => a.priority === 'high').length}
                </div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div className="px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-border">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{expiredCount}</div>
                <div className="text-xs text-muted-foreground">Expired</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-border">
            <button
              onClick={() => {
                setActiveTab('view')
                setEditingAnnouncement(null)
              }}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                View All ({announcements.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              {editingAnnouncement ? 'Edit' : 'Create New'}
            </button>
          </div>

          {/* Content */}
          {activeTab === 'create' ? (
            <AnnouncementForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setActiveTab('view')
                setEditingAnnouncement(null)
              }}
              isLoading={isSaving}
              editingAnnouncement={editingAnnouncement}
            />
          ) : (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No announcements yet</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Create your first announcement to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Announcement
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pinned announcements first */}
                  {announcements
                    .filter(a => a.is_pinned)
                    .map(announcement => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onPin={handlePin}
                      />
                    ))}

                  {/* Regular announcements */}
                  {announcements
                    .filter(a => !a.is_pinned)
                    .map(announcement => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onPin={handlePin}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteConfirm.isOpen}
            announcementTitle={deleteConfirm.title}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirm({ isOpen: false, id: '', title: '' })}
            isLoading={isSaving}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
