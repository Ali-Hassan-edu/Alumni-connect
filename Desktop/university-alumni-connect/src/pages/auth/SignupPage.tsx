// src/pages/auth/SignupPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GraduationCap, Eye, EyeOff, Loader2, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { signUpWithEmail } from '@/lib/firebase/auth'
import { userQueries } from '@/lib/supabase/queries'
import { supabase } from '@/lib/supabase/client'
import { alumniSignupSchema, studentSignupSchema } from '@/lib/validations'
import type { AlumniSignupForm, StudentSignupForm } from '@/lib/types'

const SKILLS = ['React','Next.js','Node.js','Flutter','Python','Java','TypeScript','MongoDB','PostgreSQL','Firebase','Machine Learning','UI/UX','Android','iOS','DevOps','Docker','AWS']
const INTERESTS = ['Web Dev','Mobile Dev','AI/ML','Data Science','Cybersecurity','Cloud','Game Dev','UI/UX','Open Source','Entrepreneurship','Research']
type Dept = { id: string; name: string; code: string }
type Role = 'alumni' | 'student'

function TagInput({ value, onChange, suggestions, placeholder }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; placeholder?: string }) {
  const [inp, setInp] = useState('')
  const add = (t: string) => { const s = t.trim(); if (s && !value.includes(s)) onChange([...value, s]); setInp('') }
  return (
    <div>
      <div className="min-h-[44px] w-full px-3 py-2 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-1.5 items-center">
        {value.map(t => <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">{t}<button type="button" onClick={() => onChange(value.filter(x => x !== t))}><X className="w-3 h-3" /></button></span>)}
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), inp && add(inp))} placeholder={value.length === 0 ? placeholder : ''} className="flex-1 min-w-[100px] outline-none bg-transparent text-sm" />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">{suggestions.filter(s => !value.includes(s)).slice(0, 6).map(s => <button key={s} type="button" onClick={() => add(s)} className="px-2 py-0.5 text-xs border border-dashed border-border rounded-full text-muted-foreground hover:border-blue-400 hover:text-blue-600">+ {s}</button>)}</div>
    </div>
  )
}

function AlumniForm({ depts }: { depts: Dept[] }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, trigger, control, formState: { errors } } = useForm<AlumniSignupForm>({ resolver: zodResolver(alumniSignupSchema), defaultValues: { skills: [] } })
  const ic = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
  const ec = "mt-1 text-xs text-red-500"

  const next = async () => {
    const ok = await trigger(step === 1 ? ['full_name','email','password','confirm_password'] : ['registration_number','department_id','batch','passing_year','phone'])
    if (ok) setStep(s => s + 1)
  }

  const onSubmit = async (data: AlumniSignupForm) => {
    setLoading(true)
    try {
      const cred = await signUpWithEmail(data.email, data.password, data.full_name)
      let deptId = data.department_id
      const found = depts.find(d => d.id === deptId)
      if (!found) { const { data: d } = await supabase.from('departments').select('id').eq('id', deptId).single(); if (d) deptId = d.id }
      const dbUser = await userQueries.createUser({ firebase_uid: cred.user.uid, email: data.email, full_name: data.full_name, role: 'alumni', account_status: 'pending', registration_number: data.registration_number, department_id: deptId, phone: data.phone, linkedin_url: data.linkedin_url || undefined, short_bio: data.short_bio || undefined, is_email_verified: false })
      if (!dbUser) throw new Error('Failed')
      await supabase.from('alumni_profiles').insert({ user_id: dbUser.id, batch: data.batch, passing_year: parseInt(data.passing_year), current_company: data.current_company || null, job_title: data.job_title || null, skills: data.skills })
      toast.success('Account created! Verify your email.'); navigate('/auth/verify-email')
    } catch (e: unknown) { toast.error(e instanceof Error && e.message.includes('email-already-in-use') ? 'Email already registered.' : 'Signup failed.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && <div className="space-y-4">
        <div><label className={lc}>Full Name</label><input {...register('full_name')} placeholder="Muhammad Ali" className={ic} />{errors.full_name && <p className={ec}>{errors.full_name.message}</p>}</div>
        <div><label className={lc}>Email</label><input {...register('email')} type="email" placeholder="you@email.com" className={ic} />{errors.email && <p className={ec}>{errors.email.message}</p>}</div>
        <div><label className={lc}>Password</label><div className="relative"><input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" className={`${ic} pr-11`} /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{errors.password && <p className={ec}>{errors.password.message}</p>}</div>
        <div><label className={lc}>Confirm Password</label><input {...register('confirm_password')} type="password" className={ic} />{errors.confirm_password && <p className={ec}>{errors.confirm_password.message}</p>}</div>
      </div>}
      {step === 2 && <div className="space-y-4">
        <div><label className={lc}>Registration Number</label><input {...register('registration_number')} placeholder="FA23-BSSE-024" className={ic} />{errors.registration_number && <p className={ec}>{errors.registration_number.message}</p>}</div>
        <div><label className={lc}>Department</label><select {...register('department_id')} className={ic}><option value="">Select</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.department_id && <p className={ec}>{errors.department_id.message}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lc}>Batch</label><input {...register('batch')} placeholder="2018" className={ic} />{errors.batch && <p className={ec}>{errors.batch.message}</p>}</div>
          <div><label className={lc}>Passing Year</label><input {...register('passing_year')} placeholder="2022" className={ic} />{errors.passing_year && <p className={ec}>{errors.passing_year.message}</p>}</div>
        </div>
        <div><label className={lc}>Phone</label><input {...register('phone')} placeholder="+92 300 1234567" className={ic} />{errors.phone && <p className={ec}>{errors.phone.message}</p>}</div>
      </div>}
      {step === 3 && <div className="space-y-4">
        <div><label className={lc}>LinkedIn (optional)</label><input {...register('linkedin_url')} placeholder="https://linkedin.com/in/you" className={ic} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lc}>Company</label><input {...register('current_company')} placeholder="Systems Ltd" className={ic} /></div>
          <div><label className={lc}>Job Title</label><input {...register('job_title')} placeholder="Engineer" className={ic} /></div>
        </div>
        <div><label className={lc}>Skills *</label><Controller name="skills" control={control} render={({ field }) => <TagInput value={field.value as string[]} onChange={field.onChange} suggestions={SKILLS} placeholder="Type skill..." />} />{errors.skills && <p className={ec}>{errors.skills.message}</p>}</div>
        <div><label className={lc}>Short Bio (optional)</label><textarea {...register('short_bio')} rows={3} className={`${ic} resize-none`} placeholder="Tell the community about yourself..." /></div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400">Admin will review your account within 24 hours.</div>
      </div>}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
        {step > 1 ? <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent"><ChevronLeft className="w-4 h-4" />Back</button> : <div />}
        {step < 3 ? <button type="button" onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Continue<ChevronRight className="w-4 h-4" /></button>
          : <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><CheckCircle className="w-4 h-4" />Create Account</>}</button>}
      </div>
    </form>
  )
}

function StudentForm({ depts }: { depts: Dept[] }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, trigger, control, formState: { errors } } = useForm<StudentSignupForm>({ resolver: zodResolver(studentSignupSchema), defaultValues: { skills: [], interests: [] } })
  const ic = "w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
  const ec = "mt-1 text-xs text-red-500"

  const next = async () => {
    const ok = await trigger(step === 1 ? ['full_name','email','password','confirm_password'] : ['registration_number','department_id','semester','cgpa','phone'])
    if (ok) setStep(s => s + 1)
  }

  const onSubmit = async (data: StudentSignupForm) => {
    setLoading(true)
    try {
      const cred = await signUpWithEmail(data.email, data.password, data.full_name)
      const dbUser = await userQueries.createUser({ firebase_uid: cred.user.uid, email: data.email, full_name: data.full_name, role: 'student', account_status: 'pending', registration_number: data.registration_number, department_id: data.department_id, phone: data.phone, linkedin_url: data.linkedin_url || undefined, short_bio: data.short_bio || undefined, is_email_verified: false })
      if (!dbUser) throw new Error('Failed')
      await supabase.from('student_profiles').insert({ user_id: dbUser.id, semester: parseInt(data.semester), cgpa: parseFloat(data.cgpa), skills: data.skills, interests: data.interests, github_url: data.github_url || null })
      toast.success('Account created! Verify your email.'); navigate('/auth/verify-email')
    } catch (e: unknown) { toast.error(e instanceof Error && e.message.includes('email-already-in-use') ? 'Email already registered.' : 'Signup failed.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && <div className="space-y-4">
        <div><label className={lc}>Full Name</label><input {...register('full_name')} placeholder="Muhammad Ali" className={ic} />{errors.full_name && <p className={ec}>{errors.full_name.message}</p>}</div>
        <div><label className={lc}>Email</label><input {...register('email')} type="email" placeholder="you@email.com" className={ic} />{errors.email && <p className={ec}>{errors.email.message}</p>}</div>
        <div><label className={lc}>Password</label><div className="relative"><input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" className={`${ic} pr-11`} /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>{errors.password && <p className={ec}>{errors.password.message}</p>}</div>
        <div><label className={lc}>Confirm Password</label><input {...register('confirm_password')} type="password" className={ic} />{errors.confirm_password && <p className={ec}>{errors.confirm_password.message}</p>}</div>
      </div>}
      {step === 2 && <div className="space-y-4">
        <div><label className={lc}>Registration Number</label><input {...register('registration_number')} placeholder="FA23-BSSE-024" className={ic} />{errors.registration_number && <p className={ec}>{errors.registration_number.message}</p>}</div>
        <div><label className={lc}>Department</label><select {...register('department_id')} className={ic}><option value="">Select</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.department_id && <p className={ec}>{errors.department_id.message}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lc}>Semester</label><select {...register('semester')} className={ic}><option value="">Select</option>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}</select>{errors.semester && <p className={ec}>{errors.semester.message}</p>}</div>
          <div><label className={lc}>CGPA</label><input {...register('cgpa')} type="number" step="0.01" min="0" max="4" placeholder="3.5" className={ic} />{errors.cgpa && <p className={ec}>{errors.cgpa.message}</p>}</div>
        </div>
        <div><label className={lc}>Phone</label><input {...register('phone')} placeholder="+92 300 1234567" className={ic} />{errors.phone && <p className={ec}>{errors.phone.message}</p>}</div>
      </div>}
      {step === 3 && <div className="space-y-4">
        <div><label className={lc}>LinkedIn (optional)</label><input {...register('linkedin_url')} className={ic} /></div>
        <div><label className={lc}>GitHub (optional)</label><input {...register('github_url')} placeholder="https://github.com/username" className={ic} /></div>
        <div><label className={lc}>Skills *</label><Controller name="skills" control={control} render={({ field }) => <TagInput value={field.value as string[]} onChange={field.onChange} suggestions={SKILLS} placeholder="Type skill..." />} />{errors.skills && <p className={ec}>{errors.skills.message}</p>}</div>
        <div><label className={lc}>Interests *</label><Controller name="interests" control={control} render={({ field }) => <TagInput value={field.value as string[]} onChange={field.onChange} suggestions={INTERESTS} placeholder="Type interest..." />} />{errors.interests && <p className={ec}>{errors.interests.message}</p>}</div>
        <div><label className={lc}>Short Bio (optional)</label><textarea {...register('short_bio')} rows={3} className={`${ic} resize-none`} /></div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-xs text-amber-700 dark:text-amber-400">Admin will review your account within 24 hours.</div>
      </div>}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
        {step > 1 ? <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent"><ChevronLeft className="w-4 h-4" />Back</button> : <div />}
        {step < 3 ? <button type="button" onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Continue<ChevronRight className="w-4 h-4" /></button>
          : <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><CheckCircle className="w-4 h-4" />Create Account</>}</button>}
      </div>
    </form>
  )
}

export default function SignupPage() {
  const [searchParams] = useSearchParams()
  const [role, setRole] = useState<Role>((searchParams.get('role') as Role) || 'student')
  const [depts, setDepts] = useState<Dept[]>([{id:'a1b2c3d4-0000-0000-0000-000000000001',name:'Computer Science',code:'CS'},{id:'a1b2c3d4-0000-0000-0000-000000000002',name:'Software Engineering',code:'SE'},{id:'a1b2c3d4-0000-0000-0000-000000000003',name:'Electrical Engineering',code:'EE'},{id:'a1b2c3d4-0000-0000-0000-000000000005',name:'Business Administration',code:'BA'}])

  useEffect(() => {
    supabase.from('departments').select('*').then(({ data }) => { if (data && data.length > 0) setDepts(data as Dept[]) })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div><span className="font-bold hidden sm:block">Alumni Connect</span></Link>
        <p className="text-sm text-muted-foreground">Member? <Link to="/auth/login" className="text-blue-600 font-medium">Sign in</Link></p>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join the Community</h1>
          <p className="text-muted-foreground mb-6">Choose your role to get started</p>
          <div className="inline-flex rounded-xl border border-border p-1 bg-muted/50">
            {(['student','alumni'] as Role[]).map(r => (
              <button key={r} onClick={() => setRole(r)} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${role===r ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {r === 'student' ? '🎓 Present Student' : '💼 Alumni'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          {role === 'alumni' ? <AlumniForm key="alumni" depts={depts} /> : <StudentForm key="student" depts={depts} />}
        </div>
      </div>
    </div>
  )
}
