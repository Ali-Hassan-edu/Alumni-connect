// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signInWithEmail } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { useAuthStore } from '@/lib/stores/authStore'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setFirebaseUser, setDbUser } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = new URLSearchParams(location.search).get('redirect') || '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const cred = await signInWithEmail(data.email, data.password)
      setFirebaseUser(cred.user)
      const dbUser = await userQueries.getByFirebaseUid(cred.user.uid)
      setDbUser(dbUser)
      if (!dbUser) { toast.error('Account not found.'); return }
      if (dbUser.account_status === 'pending') { navigate('/auth/pending-approval'); return }
      if (dbUser.account_status === 'rejected' || dbUser.account_status === 'blocked') { toast.error('Your account has been blocked. Contact admin.'); return }
      toast.success(`Welcome back, ${dbUser.full_name.split(' ')[0]}!`)
      if (dbUser.role === 'super_admin') navigate('/dashboard/admin')
      else if (dbUser.role === 'alumni') navigate('/dashboard/alumni')
      else navigate('/dashboard/student')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('user-not-found') || msg.includes('wrong-password')) toast.error('Invalid email or password.')
      else toast.error('Login failed. Please try again.')
    } finally { setIsLoading(false) }
  }

  const ic = "w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-12 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md lg:max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Alumni Connect</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">COMSATS University Vehari</p>
            </div>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input {...register('email')} type="email" placeholder="your@email.com" className={ic} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Your password" className={`${ic} pr-11`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end pt-2">
              <Link to="/auth/reset-password" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading} className="w-full min-h-12 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              {isLoading ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-5">
            Not a member? <Link to="/auth/signup" className="text-blue-600 font-medium hover:text-blue-700">Join now</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
