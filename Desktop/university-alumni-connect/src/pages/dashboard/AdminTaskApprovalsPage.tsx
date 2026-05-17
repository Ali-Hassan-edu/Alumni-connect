import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { approvalQueries, notificationQueries } from '@/lib/supabase/queries'
import { CheckCircle, XCircle, MessageSquare, Calendar, Briefcase, AlertCircle } from 'lucide-react'
import type { TaskApproval, Task, User } from '@/lib/types'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import { TagInput } from '@/components/TagInput'

interface PendingApproval extends TaskApproval {
  task?: Task & { alumni?: User }
  admin?: User
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Urgent', icon: '🔴' },
  high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'High', icon: '🟠' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Medium', icon: '🟡' },
  low: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Low', icon: '🟢' },
}

export default function AdminTaskApprovalsPage() {
  const { dbUser } = useAuthStore()
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([])
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    setIsLoading(true)
    try {
      const data = await approvalQueries.getPendingTaskApprovals()
      setApprovals(data as PendingApproval[])
    } catch (error) {
      console.error('Error loading approvals:', error)
      toast.error('Failed to load pending approvals')
    } finally {
      setIsLoading(false)
    }
  }

  const openApprovalModal = (approval: PendingApproval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setModalAction(action)
    setNotes('')
    setRecommendedSkills(approval.task?.recommended_skills || [])
    setShowModal(true)
  }

  const handleAction = async () => {
    if (!selectedApproval || !modalAction || !dbUser) return

    setProcessingId(selectedApproval.id)
    try {
      if (modalAction === 'approve') {
        await approvalQueries.approveTask(
          selectedApproval.task_id,
          dbUser.id,
          notes,
          {
            admin_notes: notes || undefined,
            recommended_skills: recommendedSkills,
          }
        )

        // Send notification to alumni
        if (selectedApproval.task?.posted_by) {
          await notificationQueries.createNotification({
            user_id: selectedApproval.task.posted_by,
            type: 'task_approved',
            title: 'Task Approved! ✅',
            message: `Your task "${selectedApproval.task?.title}" has been approved and is now live.`,
            link: `/tasks/${selectedApproval.task?.id}`,
          })
        }
        toast.success('Task approved successfully')
      } else {
        await approvalQueries.rejectTask(
          selectedApproval.task_id,
          dbUser.id,
          notes,
          {
            admin_notes: notes || undefined,
            recommended_skills: recommendedSkills,
          }
        )

        // Send notification to alumni
        if (selectedApproval.task?.posted_by) {
          await notificationQueries.createNotification({
            user_id: selectedApproval.task.posted_by,
            type: 'task_approved',
            title: 'Task Needs Revision',
            message: `Your task "${selectedApproval.task?.title}" requires revisions. ${notes ? `Admin notes: ${notes}` : ''}`,
            link: `/tasks/${selectedApproval.task?.id}`,
          })
        }
        toast.success('Task rejected successfully')
      }

      setApprovals(prev => prev.filter(a => a.id !== selectedApproval.id))
      setShowModal(false)
      setSelectedApproval(null)
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Failed to process approval')
    } finally {
      setProcessingId(null)
    }
  }

  const isDeadlinePast = (deadline: string) => {
    try {
      return isPast(new Date(deadline))
    } catch {
      return false
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Task Approvals</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review and approve pending tasks from alumni
              </p>
            </div>
            <div className="px-4 py-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{approvals.length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Pending {approvals.length === 1 ? 'approval' : 'approvals'}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 sm:h-40 rounded-xl" />
            ))}
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-emerald-400 mb-3 sm:mb-4" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">All caught up!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">No pending task approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            {approvals.map(approval => (
              <TaskApprovalCard
                key={approval.id}
                approval={approval}
                isProcessing={processingId === approval.id}
                onApprove={() => openApprovalModal(approval, 'approve')}
                onReject={() => openApprovalModal(approval, 'reject')}
                isDeadlinePast={isDeadlinePast(approval.task?.deadline || '')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showModal && selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          action={modalAction}
          notes={notes}
          setNotes={setNotes}
          recommendedSkills={recommendedSkills}
          setRecommendedSkills={setRecommendedSkills}
          isProcessing={processingId === selectedApproval.id}
          onConfirm={handleAction}
          onCancel={() => {
            setShowModal(false)
            setSelectedApproval(null)
          }}
          isDeadlinePast={isDeadlinePast(selectedApproval.task?.deadline || '')}
        />
      )}
    </DashboardLayout>
  )
}

interface TaskApprovalCardProps {
  approval: PendingApproval
  isProcessing: boolean
  onApprove: () => void
  onReject: () => void
  isDeadlinePast: boolean
}

function TaskApprovalCard({
  approval,
  isProcessing,
  onApprove,
  onReject,
  isDeadlinePast,
}: TaskApprovalCardProps) {
  const task = approval.task
  const alumni = task?.alumni
  const priority = task?.priority || 'medium'
  const priorityConfig = PRIORITY_CONFIG[priority]

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4">
        {/* Alumni Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm sm:text-base flex-shrink-0">
          {alumni?.full_name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </div>

        {/* Task Title and Alumni Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{task?.title}</h3>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">{alumni?.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{alumni?.email}</p>
          </div>
        </div>

        {/* Priority Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${priorityConfig.color}`}>
          {priorityConfig.icon} {priorityConfig.label}
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-3 mb-4 pb-4 border-b border-border">
        {/* Description */}
        {task?.description && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team Size */}
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Team Size</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{task?.team_size || 'N/A'}</p>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Deadline</p>
              <p className={`text-sm font-medium ${isDeadlinePast ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {task?.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Budget */}
          {task?.budget_stipend && (
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Budget</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{task.budget_stipend}</p>
              </div>
            </div>
          )}

          {/* Submitted */}
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        {task?.required_skills && task.required_skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-1">
              {task.required_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deadline Warning */}
        {isDeadlinePast && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">Deadline has passed</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:min-h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Approve</span>
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:min-h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          <span className="text-sm">Reject</span>
        </button>
      </div>
    </div>
  )
}

interface ApprovalModalProps {
  approval: PendingApproval
  action: 'approve' | 'reject' | null
  notes: string
  setNotes: (notes: string) => void
  recommendedSkills: string[]
  setRecommendedSkills: (skills: string[]) => void
  isProcessing: boolean
  onConfirm: () => void
  onCancel: () => void
  isDeadlinePast: boolean
}

function ApprovalModal({
  approval,
  action,
  notes,
  setNotes,
  recommendedSkills,
  setRecommendedSkills,
  isProcessing,
  onConfirm,
  onCancel,
  isDeadlinePast,
}: ApprovalModalProps) {
  const task = approval.task
  const alumni = task?.alumni

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {action === 'approve' ? 'Approve Task' : 'Reject Task'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {action === 'approve' ? 'Review and approve this task' : 'Reject with feedback'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Task Summary */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Task Summary</p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 space-y-2.5">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Title</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{task?.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Posted by</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{alumni?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{task?.description}</p>
              </div>
            </div>
          </div>

          {/* Warning if Deadline Past */}
          {isDeadlinePast && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">
                ⚠️ This task's deadline has already passed. Consider whether it should still be approved.
              </p>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Feedback (Required)'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={
                action === 'approve'
                  ? 'Add any notes about why you approved this task...'
                  : 'Explain why this task is being rejected and what needs to be fixed...'
              }
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              disabled={isProcessing}
            />
            {action === 'reject' && notes.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Feedback is important for the alumni</p>
            )}
          </div>

          {action === 'approve' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommended Skills (Optional)
              </label>
              <TagInput
                tags={recommendedSkills}
                onAdd={(tag) => setRecommendedSkills([...recommendedSkills, tag])}
                onRemove={(tag) => setRecommendedSkills(recommendedSkills.filter(s => s !== tag))}
                placeholder="Add recommended skills..."
              />
              <p className="text-xs text-muted-foreground mt-1">These help students find matching tasks</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 sm:min-h-12 rounded-lg border border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing || (action === 'reject' && notes.length === 0)}
              className={`flex-1 px-4 py-2.5 sm:min-h-12 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isProcessing ? 'Processing...' : action === 'approve' ? 'Approve Task' : 'Reject Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Users({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
