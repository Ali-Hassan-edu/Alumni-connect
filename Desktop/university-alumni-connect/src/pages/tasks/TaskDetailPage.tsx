

// src/app/tasks/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, CalendarDays, Users, Clock, Briefcase, CheckCircle,
  UserPlus, Send, Loader2, Star, AlertTriangle, Upload
} from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { notificationQueries } from '@/lib/supabase/queries'
import type { Task, TaskAssignment, User } from '@/lib/types'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import toast from 'react-hot-toast'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function TaskDetailPage() {
  const { id = '' } = useParams()
  const { dbUser } = useAuthStore()
  const [task, setTask] = useState<Task & { alumni?: User } | null>(null)
  const [assignments, setAssignments] = useState<(TaskAssignment & { student?: User })[]>([])
  const [matchedStudents, setMatchedStudents] = useState<User[]>([])
  const [myAssignment, setMyAssignment] = useState<TaskAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitNote, setSubmitNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(() => { if (id) loadTask() }, [id])

  const loadTask = async () => {
    setIsLoading(true)
    const [taskRes, assignRes] = await Promise.all([
      supabase.from('tasks').select('*, alumni:users(*)').eq('id', id).single(),
      supabase.from('task_assignments').select('*, student:users(*)').eq('task_id', id),
    ])
    const taskData = taskRes.data as unknown as (Task & { alumni?: User })
    setTask(taskData)
    setAssignments((assignRes.data as unknown as (TaskAssignment & { student?: User })[]) || [])

    // Find my assignment
    if (dbUser?.role === 'student') {
      const mine = assignRes.data?.find((a: TaskAssignment) => a.student_id === dbUser.id)
      setMyAssignment(mine as TaskAssignment || null)
    }

    // Find skill-matched students (admin only)
    if (dbUser?.role === 'super_admin' && taskData) {
      const { data: students } = await supabase
        .from('student_profiles')
        .select('*, user:users(*)')
        .contains('skills', taskData.required_skills.slice(0, 2))
        .limit(8)
      if (students) {
        setMatchedStudents(students.map((s: { user: User }) => s.user).filter(Boolean))
      }
    }
    setIsLoading(false)
  }

  const handleAssignStudent = async (studentId: string, studentName: string) => {
    if (!task) return
    setAssigningId(studentId)
    try {
      const { data } = await supabase.from('task_assignments').insert({
        task_id: task.id,
        student_id: studentId,
        assigned_by: dbUser?.id,
        status: 'active',
      }).select('*, student:users(*)').single()

      setAssignments(prev => [...prev, data as unknown as TaskAssignment & { student?: User }])
      // Update task status
      await supabase.from('tasks').update({ status: 'assigned' }).eq('id', task.id)
      setTask(t => t ? { ...t, status: 'assigned' } : t)

      // Notify student
      await notificationQueries.createNotification({
        user_id: studentId,
        type: 'task_assigned',
        title: '🎯 New Task Assigned!',
        message: `You have been assigned to "${task.title}" by admin. Check it out!`,
        link: `/tasks/${task.id}`,
      })
      // Notify alumni
      if (task.posted_by) {
        await notificationQueries.createNotification({
          user_id: task.posted_by,
          type: 'task_assigned',
          title: 'Student Assigned to Your Task',
          message: `${studentName} has been assigned to your task "${task.title}".`,
          link: `/tasks/${task.id}`,
        })
      }
      toast.success(`${studentName} assigned successfully!`)
    } catch {
      toast.error('Failed to assign student.')
    } finally {
      setAssigningId(null)
    }
  }

  const handleSubmitWork = async () => {
    if (!myAssignment || !submitNote.trim()) return
    setIsSubmitting(true)
    try {
      await supabase.from('task_assignments').update({ status: 'submitted', submission_notes: submitNote }).eq('id', myAssignment.id)
      setMyAssignment(a => a ? { ...a, status: 'submitted' } : a)
      // Notify alumni
      if (task?.posted_by) {
        await notificationQueries.createNotification({
          user_id: task.posted_by,
          type: 'task_submitted',
          title: 'Work Submitted',
          message: `${dbUser?.full_name} submitted work for "${task.title}".`,
          link: `/tasks/${task.id}`,
        })
      }
      toast.success('Work submitted successfully!')
      setSubmitNote('')
    } catch {
      toast.error('Failed to submit.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveSubmission = async (assignmentId: string, studentId: string) => {
    await supabase.from('task_assignments').update({ status: 'approved' }).eq('id', assignmentId)
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: 'approved' } : a))
    await notificationQueries.createNotification({
      user_id: studentId,
      type: 'task_approved',
      title: '✅ Work Approved!',
      message: `Your submission for "${task?.title}" has been approved!`,
      link: `/tasks/${id}`,
    })
    toast.success('Submission approved!')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h2 className="font-semibold text-xl">Task not found</h2>
          <Link to="/tasks" className="text-blue-600 text-sm mt-2 inline-block">← Back to Tasks</Link>
        </div>
      </DashboardLayout>
    )
  }

  const isAdmin = dbUser?.role === 'super_admin'
  const isAlumni = dbUser?.id === task.posted_by
  const isAssignedStudent = !!myAssignment
  const deadlinePast = isPast(new Date(task.deadline))
  const alreadyAssignedIds = assignments.map(a => a.student_id)

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Link to="/tasks" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Task Info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority} priority
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      task.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">{task.description}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {task.required_skills.map(skill => (
                  <span key={skill} className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">{skill}</span>
                ))}
              </div>

              {task.alumni && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar name={task.alumni.full_name} imageUrl={task.alumni.profile_picture_url} />
                  <div>
                    <Link to={`/profile/${task.posted_by}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">
                      {task.alumni.full_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">Posted {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
              )}
            </div>

            {/* My Assignment (student view) */}
            {isAssignedStudent && myAssignment && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Your Assignment</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    myAssignment.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    myAssignment.status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    myAssignment.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {myAssignment.status}
                  </span>
                </div>

                {myAssignment.status === 'active' && (
                  <div className="space-y-3">
                    <textarea
                      value={submitNote}
                      onChange={e => setSubmitNote(e.target.value)}
                      rows={4}
                      placeholder="Describe your work, provide links, or add submission notes..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <button
                      onClick={handleSubmitWork}
                      disabled={isSubmitting || !submitNote.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Submit Work
                    </button>
                  </div>
                )}
                {myAssignment.status === 'submitted' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                    <Clock className="w-4 h-4" /> Work submitted. Waiting for approval.
                  </div>
                )}
                {myAssignment.status === 'approved' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Work approved! Great job 🎉
                  </div>
                )}
              </div>
            )}

            {/* Assignments list (admin / alumni view) */}
            {(isAdmin || isAlumni) && assignments.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Assigned Students ({assignments.length})</h2>
                <div className="space-y-3">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border">
                      {assignment.student && (
                        <>
                          <Avatar name={assignment.student.full_name} imageUrl={assignment.student.profile_picture_url} size="sm" />
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${assignment.student_id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600">
                              {assignment.student.full_name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              Assigned {formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })}
                            </div>
                            {assignment.submission_notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{assignment.submission_notes}</p>
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          assignment.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          assignment.status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          assignment.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {assignment.status}
                        </span>
                        {assignment.status === 'submitted' && (isAdmin || isAlumni) && (
                          <button
                            onClick={() => handleApproveSubmission(assignment.id, assignment.student_id)}
                            className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 font-medium transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Task Meta */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Task Details</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Deadline</span>
                  <span className={`font-medium ${deadlinePast ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {format(new Date(task.deadline), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-4 h-4" /> Team Size</span>
                  <span className="font-medium text-gray-900 dark:text-white">{task.team_size} {task.team_size === 1 ? 'person' : 'people'}</span>
                </div>
                {task.budget_stipend && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stipend</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">💰 {task.budget_stipend}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assigned</span>
                  <span className="font-medium text-gray-900 dark:text-white">{assignments.length}/{task.team_size}</span>
                </div>
              </div>
            </div>

            {/* Skill-matched students (Admin only) */}
            {isAdmin && matchedStudents.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Skill-Matched Students
                  </span>
                </h3>
                <div className="space-y-3">
                  {matchedStudents.filter(s => !alreadyAssignedIds.includes(s.id)).slice(0, 5).map(student => (
                    <div key={student.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                      <Avatar name={student.full_name} imageUrl={student.profile_picture_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${student.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate block">
                          {student.full_name}
                        </Link>
                      </div>
                      <button
                        onClick={() => handleAssignStudent(student.id, student.full_name)}
                        disabled={assigningId === student.id || assignments.length >= task.team_size}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shrink-0"
                      >
                        {assigningId === student.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                        Assign
                      </button>
                    </div>
                  ))}
                  {matchedStudents.filter(s => !alreadyAssignedIds.includes(s.id)).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">All matched students assigned</p>
                  )}
                </div>
              </div>
            )}

            {deadlinePast && task.status !== 'completed' && (
              <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">This task&apos;s deadline has passed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
