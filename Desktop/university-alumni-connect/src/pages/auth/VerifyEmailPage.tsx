// src/pages/auth/VerifyEmailPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, GraduationCap, RefreshCw, Loader2 } from 'lucide-react'
import { resendVerificationEmail, signOutUser } from '@/lib/firebase/auth'
import { useAuthStore } from '@/lib/stores/authStore'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    setIsSending(true)
    try { await resendVerificationEmail(); toast.success('Verification email sent!') }
    catch { toast.error('Failed to resend. Try again.') }
    finally { setIsSending(false) }
  }

  const handleSignOut = async () => {
    await signOutUser(); clearAuth(); navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-white" /></div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">Alumni Connect</span>
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-8 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">We've sent a verification link to your email. Click it to continue, then sign in.</p>
          <div className="space-y-3">
            <button onClick={handleResend} disabled={isSending} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Resend Email
            </button>
            <Link to="/auth/login" className="flex items-center justify-center w-full py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors">
              Already verified? Sign In
            </Link>
            <button onClick={handleSignOut} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
