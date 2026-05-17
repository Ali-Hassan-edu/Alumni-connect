import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import MobileNav from './MobileNav'
import { touchFriendly } from '@/lib/responsive'

export default function Navbar() {
  const { dbUser } = useAuthStore()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo - Responsive sizing */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Alumni Connect" 
                className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-lg shadow-md group-hover:shadow-lg transition-all"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
            </div>
            <div className="hidden xs:block">
              <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                Alumni Connect
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                COMSATS Vehari
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <Link 
              to="/" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              Home
            </Link>
            <a 
              href="#features" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              Features
            </a>
            <a 
              href="#team" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              Team
            </a>
            <a 
              href="#contact" 
              className="px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            >
              Contact
            </a>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme toggle - Touch friendly */}
            <button
              onClick={toggleTheme}
              className={`rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400 ${touchFriendly.button}`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-5 h-5 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Auth buttons - Hide on mobile, show from sm: */}
            {dbUser ? (
              <button
                onClick={() => navigate(getDashboardLink())}
                className="hidden sm:inline-flex px-4 py-2 sm:px-5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 min-h-10 sm:min-h-11"
              >
                Dashboard
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-10 sm:min-h-11 flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="px-4 py-2 sm:px-5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 min-h-10 sm:min-h-11 flex items-center"
                >
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile menu - Authenticated users use MobileNav drawer */}
            {dbUser ? (
              <MobileNav />
            ) : (
              <>
                {/* Mobile menu button for non-authenticated users */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${touchFriendly.button}`}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu for non-authenticated users */}
        {mobileMenuOpen && !dbUser && (
          <div className="lg:hidden border-t border-gray-200 dark:border-slate-800 py-3 sm:py-4 space-y-1 transition-all duration-200 ease-in-out">
            <Link
              to="/"
              className="block px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="#features"
              className="block px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#team"
              className="block px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Team
            </a>
            <a
              href="#contact"
              className="block px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
              <Link
                to="/auth/login"
                className="block px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="block px-4 py-2.5 sm:py-3 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
