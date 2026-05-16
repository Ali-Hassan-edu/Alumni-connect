// src/pages/LandingPage.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  GraduationCap, Users, Briefcase, Calendar, MessageSquare,
  ArrowRight, Star, CheckCircle, Shield, Bell, Moon, Sun
} from 'lucide-react'
import { useState, useEffect } from 'react'

const STATS = [
  { value: '500+', label: 'Alumni Members' },
  { value: '1200+', label: 'Current Students' },
  { value: '150+', label: 'Tasks Completed' },
  { value: '50+', label: 'Events Hosted' },
]

const FEATURES = [
  { icon: MessageSquare, title: 'Community Forum', desc: 'Discuss, ask questions, share opportunities and connect with peers across batches.', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { icon: Briefcase, title: 'Real-World Tasks', desc: 'Alumni post projects for students. Admin assigns based on skill matching.', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' },
  { icon: Calendar, title: 'University Events', desc: 'Meetups, workshops, seminars and career fairs with easy RSVP.', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  { icon: MessageSquare, title: 'Direct Messaging', desc: 'Real-time 1-on-1 chat between alumni and students.', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' },
  { icon: Shield, title: 'Admin Controlled', desc: 'Every account approved by admin. No outsiders can access the platform.', color: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Get notified for approvals, task assignments, replies, and events instantly.', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' },
]

const TESTIMONIALS = [
  { name: 'Ahmed Raza', role: 'Alumni — Software Engineer at Systems Ltd', text: 'Alumni Connect helped me give back to my university. I posted a task and within days a talented student was assigned. Excellent platform!', batch: 'Batch 2020' },
  { name: 'Fatima Khan', role: 'Student — SE 6th Semester', text: 'I got my first real-world project through this platform. The community forum is incredibly helpful for getting career guidance from alumni.', batch: 'FA21-BSSE' },
  { name: 'Hassan Ali', role: 'Alumni — Full Stack Developer', text: 'The events system is great. I attended the alumni meetup and reconnected with professors and old friends. Highly recommended!', batch: 'Batch 2019' },
]

export default function LandingPage() {
  const { dbUser } = useAuthStore()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const getDashboardLink = () => {
    if (!dbUser) return '/auth/login'
    if (dbUser.role === 'super_admin') return '/dashboard/admin'
    if (dbUser.role === 'alumni') return '/dashboard/alumni'
    return '/dashboard/student'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">Alumni Connect</div>
              <div className="text-xs text-muted-foreground">COMSATS Vehari</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {dbUser ? (
              <button onClick={() => navigate(getDashboardLink())} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link to="/auth/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Exclusive to COMSATS Vehari Members
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
            Connect. Grow.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Give Back.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            The official community platform for COMSATS University Vehari — bridging alumni and current students through mentorship, real-world tasks, and meaningful connections.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/signup" className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Join the Community <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/auth/login" className="flex items-center gap-2 px-8 py-4 border-2 border-border bg-white dark:bg-gray-800 hover:bg-accent text-gray-900 dark:text-white font-semibold rounded-2xl text-lg transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-gray-900 border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Everything in One Place</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete platform built specifically for our university community.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="p-6 bg-card border border-border rounded-2xl hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all">
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-blue-50 dark:bg-blue-950/20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-muted-foreground">Simple 3-step process to join the community</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account as an Alumni or Present Student with your university details.' },
              { step: '02', title: 'Get Approved', desc: 'Admin verifies your identity and approves your account within 24 hours.' },
              { step: '03', title: 'Connect', desc: 'Access the community, post tasks, join discussions, and attend events.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What Members Say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, batch }) => (
            <div key={name} className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{text}"</p>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{name}</div>
                <div className="text-xs text-muted-foreground">{role}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{batch}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-blue-100 text-lg mb-8">Sign up today and become part of the COMSATS Vehari alumni community.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/signup?role=student" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors">
              🎓 Join as Student
            </Link>
            <Link to="/auth/signup?role=alumni" className="px-8 py-4 bg-white/20 border-2 border-white/40 text-white font-bold rounded-2xl hover:bg-white/30 transition-colors">
              💼 Join as Alumni
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white">University Alumni Connect</span>
        </div>
        <p>Built for COMSATS University Vehari — {new Date().getFullYear()}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link to="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/auth/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  )
}
