// src/pages/LandingPage.tsx
import { Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  Briefcase, Calendar, MessageSquare,
  ArrowRight, Star, Shield, Bell, Loader2, ChevronDown
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import TeamSection from '@/components/TeamSection'
import ContactSection from '@/components/ContactSection'
import { communityPostQueries } from '@/lib/supabase/queries'
import type { CommunityPost } from '@/lib/types'

// ── SEO Meta Tags (inject on mount) ──────────────────────────────────────────
function useSEOMeta() {
  useEffect(() => {
    document.title = 'Alumni Connect — COMSATS University Vehari'

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', 'The official alumni-student community platform for COMSATS University Vehari. Connect with alumni, get mentorship, real-world tasks, and career opportunities.')
    setMeta('og:title', 'Alumni Connect — COMSATS University Vehari', true)
    setMeta('og:description', 'Bridge the gap between alumni and students through mentorship, real-world tasks, and meaningful connections.', true)
    setMeta('og:type', 'website', true)
    setMeta('og:url', window.location.origin, true)
    setMeta('og:image', `${window.location.origin}/logo.png`, true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', 'Alumni Connect — COMSATS University Vehari')
    setMeta('twitter:description', 'The official alumni-student community platform for COMSATS University Vehari.')

    return () => {
      document.title = 'Alumni Connect'
    }
  }, [])
}

// ── Scroll-in animation hook ────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    // Observe all elements with the class
    const els = document.querySelectorAll('.scroll-reveal')
    els.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}

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
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const postsPerPage = 6

  useSEOMeta()
  useScrollReveal()

  const loadPosts = useCallback(async (page: number, append = false) => {
    if (page === 1) setLoadingPosts(true)
    else setLoadingMore(true)

    try {
      const res = await communityPostQueries.getPublicPosts({ page, limit: postsPerPage })
      if (append) {
        setCommunityPosts(prev => [...prev, ...res.data])
      } else {
        setCommunityPosts(res.data)
      }
      setHasMore(res.data.length === postsPerPage)
      setCurrentPage(page)
    } catch {
      setCommunityPosts(prev => (page === 1 ? [] : prev))
    } finally {
      setLoadingPosts(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  const handleLoadMore = () => {
    loadPosts(currentPage + 1, true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 py-20 lg:py-32" style={{
        backgroundImage: 'url(/comsats.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6 scroll-reveal">
            <Shield className="w-4 h-4" />
            Exclusive to COMSATS Vehari Members
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg mb-6 leading-tight scroll-reveal">
            Connect. Grow.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
              Give Back.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white drop-shadow mb-8 max-w-2xl mx-auto leading-relaxed scroll-reveal">
            The official community platform for COMSATS University Vehari — bridging alumni and current students through mentorship, real-world tasks, and meaningful connections.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 scroll-reveal">
            <Link to="/auth/signup" className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Join the Community <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/auth/login" className="flex items-center gap-2 px-8 py-4 border-2 border-white bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-lg transition-all backdrop-blur">
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
              <div key={label} className="text-center scroll-reveal">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12 scroll-reveal">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Everything in One Place</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete platform built specifically for our university community.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <div key={title} className="p-6 bg-card border border-border rounded-2xl hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all scroll-reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Preview with Load More */}
      <section id="community-preview" className="py-20 px-4 bg-white dark:bg-gray-900 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3 scroll-reveal">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Community Posts</h2>
              <p className="text-muted-foreground text-sm">Explore a preview of recent discussions and opportunities.</p>
            </div>
            <Link to="/community" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No community posts yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {communityPosts.map((post, i) => (
                  <div key={post.id} className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-all relative overflow-hidden scroll-reveal" style={{ transitionDelay: `${(i % 3) * 100}ms` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium capitalize">{post.post_type}</span>
                      {post.author && (
                        <span className="text-xs text-muted-foreground">by {post.author.full_name}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 blur-[1.5px]">{post.content}</p>
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/80 dark:bg-gray-900/80 border border-border text-muted-foreground">
                        Login or Signup to read more
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Load More Posts
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-blue-50 dark:bg-blue-950/20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-muted-foreground">Simple 3-step process to join the community</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account as an Alumni or Present Student with your university details.' },
              { step: '02', title: 'Get Approved', desc: 'Admin verifies your identity and approves your account within 24 hours.' },
              { step: '03', title: 'Connect', desc: 'Access the community, post tasks, join discussions, and attend events.' },
            ].map(({ step, title, desc }, i) => (
              <div key={step} className="text-center scroll-reveal" style={{ transitionDelay: `${i * 150}ms` }}>
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
        <div className="text-center mb-12 scroll-reveal">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What Members Say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, batch }, i) => (
            <div key={name} className="p-6 bg-card border border-border rounded-2xl scroll-reveal" style={{ transitionDelay: `${i * 100}ms` }}>
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

      {/* Team Section */}
      <TeamSection />

      {/* Contact Section */}
      <ContactSection />

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center text-white scroll-reveal">
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
      <footer id="footer" className="py-16 px-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 pb-12 border-b border-gray-200 dark:border-slate-800">
            {/* Logo & Description */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Alumni Connect" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-blue-500/25 flex-shrink-0" loading="lazy" />
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-base">CS Alumni Connect</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">COMSATS Vehari</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connecting alumni and students for mentorship, growth, and meaningful professional relationships.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Quick Links</h3>
              <div className="space-y-3">
                <Link to="/" className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Home</Link>
                <Link to="/community" className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Community</Link>
                <a href="#features" className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Features</a>
                <a href="#team" className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Team</a>
                <a href="#contact" className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Contact</a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Email</p>
                  <a href="mailto:abdullahwale@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    abdullahwale@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Phone</p>
                  <a href="tel:+923046983794" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    0304-6983794
                  </a>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Follow Us</h3>
              <div className="space-y-2">
                <a 
                  href="https://www.instagram.com/comsats_vehari_official/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                >
                  <span>Instagram</span>
                </a>
                <a 
                  href="https://web.facebook.com/people/Department-of-Computer-Science-CUI-Vehari/61582504795576/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                >
                  <span>Facebook</span>
                </a>
                <a 
                  href="https://ww2.comsats.edu.pk/cs_vhr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                >
                  <span>Website</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} University Alumni Connect. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/comsats_vehari_official/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                Instagram
              </a>
              <a href="https://web.facebook.com/people/Department-of-Computer-Science-CUI-Vehari/61582504795576/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                Facebook
              </a>
              <a href="https://ww2.comsats.edu.pk/cs_vhr" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                Website
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
