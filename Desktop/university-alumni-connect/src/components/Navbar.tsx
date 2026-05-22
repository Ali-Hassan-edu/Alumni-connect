import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import MobileNav from './MobileNav'
import { touchFriendly } from '@/lib/responsive'

const NAV_LINKS = [
  { label: 'Home', to: '/', hash: false },
  { label: 'Community', to: '/community', hash: false },
  { label: 'Features', to: '/#features', hash: true },
  { label: 'Team', to: '/#team', hash: true },
  { label: 'Contact', to: '/#contact', hash: true },
] as const

function NavLink({
  href,
  label,
  isHash,
  onNavigate,
}: {
  href: string
  label: string
  isHash: boolean
  onNavigate?: () => void
}) {
  const location = useLocation()
  const isActive = !isHash && location.pathname === href

  const className = `relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
    isActive
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
  }`

  if (isHash) {
    const hashHref = href.startsWith('/#') ? href : `/#${href.replace(/^#?\/?/, '')}`
    return (
      <a href={hashHref} className={className} onClick={onNavigate}>
        {label}
      </a>
    )
  }

  return (
    <Link to={href} className={className} onClick={onNavigate}>
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
    </Link>
  )
}

export default function Navbar() {
  const { dbUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLandingPage = location.pathname === '/'

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const getDashboardLink = () => {
    if (!dbUser) return '/auth/login'
    if (dbUser.role === 'super_admin' || dbUser.role === 'sub_admin') return '/dashboard/admin'
    if (dbUser.role === 'alumni') return '/dashboard/alumni'
    return '/dashboard/student'
  }

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.25rem]">
          <Link to="/" className="flex items-center gap-3 group shrink-0 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/logo.png"
                alt="Alumni Connect"
                className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700 group-hover:ring-blue-300/60 transition-all"
                loading="lazy"
              />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight">
                Alumni Connect
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                COMSATS Vehari
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1 px-6">
            <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60">
              {NAV_LINKS.map(({ label, to, hash }) => (
                <NavLink key={label} href={to} label={label} isHash={hash} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className={`rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors ${touchFriendly.button}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {dbUser && !isLandingPage ? (
              <button
                onClick={() => navigate(getDashboardLink())}
                className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20 min-h-10"
              >
                Dashboard
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-10 flex items-center rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/25 min-h-10 flex items-center"
                >
                  Join Now
                </Link>
              </div>
            )}

            {dbUser && !isLandingPage ? (
              <MobileNav />
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${touchFriendly.button}`}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {mobileMenuOpen && !dbUser && (
          <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800/80 py-4 space-y-1 animate-[slideInDown_0.2s_ease-out]">
            {NAV_LINKS.map(({ label, to, hash }) =>
              hash ? (
                <a
                  key={label}
                  href={to.startsWith('/#') ? to : `/#${to.replace(/^#?\/?/, '')}`}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  onClick={closeMobile}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={to}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    location.pathname === to
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                  onClick={closeMobile}
                >
                  {label}
                </Link>
              )
            )}
            <div className="pt-3 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-2 px-1">
              <Link
                to="/auth/login"
                className="py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                onClick={closeMobile}
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="py-3 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                onClick={closeMobile}
              >
                Join Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
