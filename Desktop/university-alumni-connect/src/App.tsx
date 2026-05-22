import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/lib/stores/authStore'
import { onAuthChange } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { useNotificationStore } from '@/lib/stores/notificationStore'

// Lazy-loaded Pages - Auth
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const PendingApprovalPage = lazy(() => import('@/pages/auth/PendingApprovalPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// Lazy-loaded Pages - Dashboard
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'))
const AdminApprovalsPage = lazy(() => import('@/pages/dashboard/AdminApprovalsPage'))
const AdminUsersPage = lazy(() => import('@/pages/dashboard/AdminUsersPage'))
const AdminTasksPage = lazy(() => import('@/pages/dashboard/AdminTasksPage'))
const AdminTaskApprovalsPage = lazy(() => import('@/pages/dashboard/AdminTaskApprovalsPage'))
const AdminPostModerationPage = lazy(() => import('@/pages/dashboard/AdminPostModerationPage'))
const AdminReportsPage = lazy(() => import('@/pages/dashboard/AdminReportsPage'))
const AdminPasswordResetPage = lazy(() => import('@/pages/dashboard/AdminPasswordResetPage'))
const AdminAnnouncementsPage = lazy(() => import('@/pages/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage })))
const AlumniDashboard = lazy(() => import('@/pages/dashboard/AlumniDashboard'))
const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard'))

// Lazy-loaded Pages - Features
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage'))
const NewThreadPage = lazy(() => import('@/pages/community/NewThreadPage'))
const ThreadDetailPage = lazy(() => import('@/pages/community/ThreadDetailPage'))
const TasksPage = lazy(() => import('@/pages/tasks/TasksPage'))
const NewTaskPage = lazy(() => import('@/pages/tasks/NewTaskPage'))
const TaskDetailPage = lazy(() => import('@/pages/tasks/TaskDetailPage'))
const EventsPage = lazy(() => import('@/pages/events/EventsPage'))
const NewEventPage = lazy(() => import('@/pages/events/NewEventPage'))
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage'))
const MessagesPage = lazy(() => import('@/pages/MessagesPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

// Route Loading Fallback
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  )
}

// Theme Manager
function ThemeManager({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Expose theme toggle globally
  useEffect(() => {
    (window as unknown as { toggleTheme: () => void }).toggleTheme = () =>
      setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  return <>{children}</>
}

// Auth Guard
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { dbUser, isLoading, isInitialized } = useAuthStore()

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!dbUser) return <Navigate to="/auth/login" replace />
  if (dbUser.account_status === 'pending') return <Navigate to="/auth/pending-approval" replace />
  if (dbUser.account_status === 'rejected' || dbUser.account_status === 'blocked') {
    return <Navigate to="/auth/login" replace />
  }
  if (roles && !roles.includes(dbUser.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

// Dynamic dashboard redirect
function DashboardRedirect() {
  const { dbUser } = useAuthStore()
  if (!dbUser) return <Navigate to="/auth/login" replace />
    if (dbUser.role === 'super_admin' || dbUser.role === 'sub_admin') return <Navigate to="/dashboard/admin" replace />
    if (dbUser.role === 'alumni') return <Navigate to="/dashboard/alumni" replace />
    return <Navigate to="/dashboard/student" replace />
  }

export default function App() {
  const { setFirebaseUser, setDbUser, setLoading, setInitialized, clearAuth } = useAuthStore()
  const { subscribeToRealtime, unsubscribe, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setLoading(true)
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        try {
          const dbUser = await userQueries.getByFirebaseUid(firebaseUser.uid)
          setDbUser(dbUser)
          if (dbUser?.account_status === 'approved') {
            subscribeToRealtime(dbUser.id)
            fetchNotifications(dbUser.id)
            userQueries.updateUser(dbUser.id, { last_seen_at: new Date().toISOString() })
          }
        } catch {
          setDbUser(null)
        }
      } else {
        clearAuth()
        unsubscribe()
      }
      setLoading(false)
      setInitialized(true)
    })
    return () => { unsub(); unsubscribe() }
  }, []) // eslint-disable-line

  return (
    <ThemeManager>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Dashboard redirect */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/dashboard/admin" element={<ProtectedRoute roles={['super_admin','sub_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/approvals" element={<ProtectedRoute roles={['super_admin']}><AdminApprovalsPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/task-approvals" element={<ProtectedRoute roles={['super_admin']}><AdminTaskApprovalsPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/announcements" element={<ProtectedRoute roles={['super_admin']}><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/users" element={<ProtectedRoute roles={['super_admin']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/tasks" element={<ProtectedRoute roles={['super_admin']}><AdminTasksPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/moderation" element={<ProtectedRoute roles={['super_admin','sub_admin']}><AdminPostModerationPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/reports" element={<ProtectedRoute roles={['super_admin','sub_admin']}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin/password-resets" element={<ProtectedRoute roles={['super_admin','sub_admin']}><AdminPasswordResetPage /></ProtectedRoute>} />

            {/* Alumni */}
            <Route path="/dashboard/alumni" element={<ProtectedRoute roles={['alumni']}><AlumniDashboard /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/dashboard/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />

            {/* Community */}
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/new" element={<ProtectedRoute><NewThreadPage /></ProtectedRoute>} />
            <Route path="/community/:id" element={<ThreadDetailPage />} />

            {/* Tasks */}
            <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="/tasks/new" element={<ProtectedRoute roles={['alumni', 'super_admin']}><NewTaskPage /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />

            {/* Events */}
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute roles={['super_admin']}><NewEventPage /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />

            {/* Other */}
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </ThemeManager>
  )
}
