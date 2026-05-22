// src/pages/auth/SignupPage.tsx
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { signUpWithEmail } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase/client'
import { signupSchema } from '@/lib/validations'
import type { SignupForm } from '@/lib/types'

type Role = 'alumni' | 'student'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState<Role>((searchParams.get('role') as Role) || 'student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingReg, setIsCheckingReg] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
  const errorClass = "mt-1 text-xs text-red-500"

  const checkRegistrationNumber = async (registrationNumber: string) => {
    if (!registrationNumber) return false
    setIsCheckingReg(true)
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('registration_number', registrationNumber.trim())
      if (error) throw error
      return (count || 0) > 0
    } finally {
      setIsCheckingReg(false)
    }
  }

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    try {
      const exists = await checkRegistrationNumber(data.registration_number)
      if (exists) {
        setError('registration_number', { type: 'manual', message: 'Registration number already in use.' })
        setIsLoading(false)
        return
      }

      const credential = await signUpWithEmail(data.email, data.password, data.full_name)
      const dbUser = await userQueries.createUser({
        firebase_uid: credential.user.uid,
        email: data.email,
        full_name: data.full_name,
        role,
        account_status: 'pending',
        registration_number: data.registration_number,
        is_email_verified: false,
      })
      if (!dbUser) throw new Error('Failed to create user profile')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: dbUser.id, batch: data.batch })
      if (profileError) throw profileError

      if (role === 'alumni') {
        await supabase.from('alumni_profiles').insert({ user_id: dbUser.id })
      } else {
        await supabase.from('student_profiles').insert({ user_id: dbUser.id })
      }

      adminService.logSignup({ role, registration_number: data.registration_number }).catch(() => {})

      setIsSuccess(true)
      toast.success('Welcome to Alumni Connect! 🎉', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#fff',
          borderRadius: '14px',
          padding: '14px 18px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
        },
        iconTheme: { primary: '#fff', secondary: '#059669' },
      })
      setTimeout(() => {
        navigate('/auth/verify-email')
      }, 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Alumni Connect" className="w-8 h-8 rounded-lg object-cover" loading="lazy" />
          <span className="font-bold text-sm sm:text-base hidden sm:block">Alumni Connect</span>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Member? <Link to="/auth/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in</Link>
        </p>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {isSuccess ? (
          <div className="text-center py-16 bg-card border border-border rounded-3xl shadow-xl shadow-emerald-500/10">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out]">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-6">Welcome to Alumni Connect. We're redirecting you to verify your email...</p>
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">Join the community in seconds</p>
          <div className="inline-flex rounded-xl border border-border p-1 bg-muted/50">
            {(['student', 'alumni'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 min-h-10 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  role === r ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'student' ? '🎓 Student' : '💼 Alumni'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <input {...register('full_name')} placeholder="Muhammad Ali" className={inputClass} />
            {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input {...register('email')} type="email" placeholder="you@email.com" className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars" className={`${inputClass} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="relative">
              <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} className={`${inputClass} pr-11`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            {errors.confirm_password && <p className={errorClass}>{errors.confirm_password.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Registration Number</label>
            <input
              {...register('registration_number')}
              placeholder="FA23-BSSE-024"
              className={inputClass}
              onBlur={async (e) => {
                const exists = await checkRegistrationNumber(e.target.value)
                if (exists) {
                  setError('registration_number', { type: 'manual', message: 'Registration number already in use.' })
                }
              }}
            />
            {isCheckingReg && <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p>}
            {errors.registration_number && <p className={errorClass}>{errors.registration_number.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Batch Number</label>
            <input {...register('batch')} placeholder="2018" className={inputClass} />
            {errors.batch && <p className={errorClass}>{errors.batch.message}</p>}
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
            Admin will review your account within 24 hours.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 min-h-12 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating...</span></> : <><CheckCircle className="w-4 h-4" /><span>Create Account</span></>}
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  )
}
