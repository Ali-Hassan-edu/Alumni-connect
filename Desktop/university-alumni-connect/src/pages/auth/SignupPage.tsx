// src/pages/auth/SignupPage.tsx
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle, GraduationCap, Briefcase, Info, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { signUpWithEmail } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase/client'
import { studentSignupSchema, alumniSignupSchema } from '@/lib/validations'
import type { StudentSignupFormData, AlumniSignupFormData } from '@/lib/validations'

type Role = 'alumni' | 'student'
type FormData = StudentSignupFormData | AlumniSignupFormData

const DEPARTMENTS = [
  { value: 'MCS', label: 'MCS — Master of Computer Science' },
  { value: 'BSCS', label: 'BSCS — Bachelor of Computer Science' },
  { value: 'BSSE', label: 'BSSE — Bachelor of Software Engineering' },
  { value: 'BSTN', label: 'BSTN — Bachelor of Telecommunication & Networking' },
] as const

const SESSIONS = [
  '2018–2022', '2019–2023', '2020–2024', '2021–2025',
  '2022–2026', '2023–2027', '2024–2028',
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState<Role>((searchParams.get('role') as Role) || 'student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(role === 'student' ? studentSignupSchema : alumniSignupSchema),
    mode: 'onBlur',
  })

  const handleRoleSwitch = (newRole: Role) => {
    setRole(newRole)
    reset()
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all placeholder:text-muted-foreground"
  const selectClass = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-12 transition-all appearance-none cursor-pointer"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
  const errorClass = "mt-1 text-xs text-red-500 flex items-center gap-1"

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      // Check for duplicate registration number only if provided
      if (data.registration_number) {
        const { count, error } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('registration_number', data.registration_number.trim())
        if (error) throw error
        if ((count || 0) > 0) {
          setError('registration_number' as never, { type: 'manual', message: 'Registration number already in use.' })
          setIsLoading(false)
          return
        }
      }

      const credential = await signUpWithEmail(data.email, data.password, data.full_name)

      // Find or create department by code
      let departmentId: string | undefined
      const { data: deptData } = await supabase
        .from('departments')
        .select('id')
        .eq('code', data.department)
        .maybeSingle()
      if (deptData) {
        departmentId = deptData.id
      } else {
        // Insert department if not found
        const { data: newDept } = await supabase
          .from('departments')
          .insert({ name: data.department, code: data.department })
          .select('id')
          .single()
        if (newDept) departmentId = newDept.id
      }

      const dbUser = await userQueries.createUser({
        firebase_uid: credential.user.uid,
        email: data.email,
        full_name: data.full_name,
        role,
        account_status: 'pending',
        registration_number: data.registration_number || null,
        phone: data.phone,
        department_id: departmentId,
        is_email_verified: false,
      })
      if (!dbUser) throw new Error('Failed to create user profile')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: dbUser.id,
          batch: data.session,
          department_id: departmentId,
          phone: data.phone,
        })
      if (profileError) throw profileError

      if (role === 'alumni') {
        await supabase.from('alumni_profiles').insert({ user_id: dbUser.id })
      } else {
        await supabase.from('student_profiles').insert({ user_id: dbUser.id })
      }

      adminService.logSignup({ role, registration_number: data.registration_number || 'N/A' }).catch(() => {})

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
      setTimeout(() => navigate('/auth/verify-email'), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Alumni Connect" className="w-9 h-9 rounded-xl object-cover shadow-md shadow-blue-500/30" loading="lazy" />
          <span className="font-bold text-sm sm:text-base hidden sm:block text-gray-900 dark:text-white">
            CS Alumni Connect
          </span>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Already a member?{' '}
          <Link to="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {isSuccess ? (
          <div className="text-center py-16 bg-card border border-border rounded-3xl shadow-xl shadow-emerald-500/10 px-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out]">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Welcome to CS Alumni Connect. Redirecting you to verify your email…
            </p>
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Page title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Join the COMSATS University Vehari community
              </p>

              {/* Role switcher */}
              <div className="inline-flex rounded-2xl border border-border p-1.5 bg-muted/50 gap-1">
                {(['student', 'alumni'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSwitch(r)}
                    className={`flex items-center gap-2 px-5 py-2.5 min-h-10 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      role === r
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-md shadow-blue-500/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r === 'student' ? (
                      <><GraduationCap className="w-4 h-4" /> Student</>
                    ) : (
                      <><Briefcase className="w-4 h-4" /> Alumni</>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input
                    {...register('full_name')}
                    placeholder="Muhammad Ali"
                    className={inputClass}
                    autoComplete="name"
                  />
                  {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@email.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>
                    {role === 'alumni' ? 'WhatsApp Number' : 'Phone Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder={role === 'alumni' ? 'Enter WhatsApp number' : '03XXXXXXXXX'}
                    className={inputClass}
                    autoComplete="tel"
                  />
                  {errors.phone && <p className={errorClass}>{(errors as Record<string, { message?: string }>).phone?.message}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className={labelClass}>Department <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select {...register('department')} className={selectClass} defaultValue="">
                      <option value="" disabled>Select your department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.department && <p className={errorClass}>{errors.department.message}</p>}
                </div>

                {/* Session / Batch */}
                <div>
                  <label className={labelClass}>Session / Batch <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select {...register('session')} className={selectClass} defaultValue="">
                      <option value="" disabled>Select your session</option>
                      {SESSIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.session && <p className={errorClass}>{(errors as Record<string, { message?: string }>).session?.message}</p>}
                </div>

                {/* Registration Number */}
                <div>
                  <label className={labelClass}>
                    Registration / Roll Number{' '}
                    {role === 'student' ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    )}
                  </label>
                  <input
                    {...register('registration_number')}
                    placeholder={role === 'student' ? 'FA23-BSSE-024' : 'e.g. FA18-BSCS-001 (optional)'}
                    className={inputClass}
                  />
                  {errors.registration_number && (
                    <p className={errorClass}>{errors.registration_number.message}</p>
                  )}
                  {/* Alumni helper text */}
                  {role === 'alumni' && (
                    <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        If you do not remember your roll number, you may leave it empty.
                        Administration will verify your information through WhatsApp/contact number.
                      </p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="pt-1 pb-1">
                  <div className="border-t border-border" />
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      className={`${inputClass} pr-11`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      {...register('confirm_password')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className={`${inputClass} pr-11`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className={errorClass}>{errors.confirm_password.message}</p>}
                </div>

                {/* Verification notice */}
                {role === 'alumni' ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                      <strong>Alumni Verification:</strong> After registration, an admin will contact you on
                      WhatsApp/Phone to verify your department and details before approving your account.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                    Admin will review your account within 24 hours.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 min-h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/25 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account…</span></>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /><span>Create Account</span></>
                  )}
                </button>

                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
