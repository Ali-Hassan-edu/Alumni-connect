// src/pages/auth/PendingApprovalPage.tsx
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, GraduationCap, Mail, LogOut, RefreshCw } from 'lucide-react'
import { signOutUser } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import toast from 'react-hot-toast'

export default function PendingApprovalPage() {
  const { dbUser, firebaseUser, setDbUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (dbUser?.account_status === 'approved') {
      if (dbUser.role === 'super_admin') navigate('/dashboard/admin')
      else if (dbUser.role === 'alumni') navigate('/dashboard/alumni')
      else navigate('/dashboard/student')
    }
  }, [dbUser, navigate])

  const handleRefresh = async () => {
    if (!firebaseUser) return
    const updated = await userQueries.getByFirebaseUid(firebaseUser.uid)
    setDbUser(updated)
    if (updated?.account_status === 'approved') {
      toast.success('Account approved! Welcome!')
    } else {
      toast('Still pending approval. Please wait.', { icon: '⏳' })
    }
  }

  const handleLogout = async () => {
    await signOutUser(); clearAuth(); navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-gray-900 dark:text-white">Alumni Connect</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Approval Pending</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">Your account is under review. Admin will approve it within <strong>24 hours</strong>.</p>

          {dbUser && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-5 mb-6 text-left space-y-2">
              <h3 className="font-semibold text-sm mb-2">Your Submission</h3>
              {[['Name', dbUser.full_name], ['Email', dbUser.email], ['Reg. No.', dbUser.registration_number]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">⏳ Pending</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={handleRefresh} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
              <RefreshCw className="w-4 h-4" /> Check Approval Status
            </button>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-400">
              <Mail className="w-4 h-4 shrink-0" /> You'll receive an email once approved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
