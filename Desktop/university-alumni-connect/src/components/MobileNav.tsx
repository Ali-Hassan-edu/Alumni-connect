import { useState } from 'react'
import { Menu, X, Home, Users, Briefcase, Calendar, MessageSquare, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import { signOutUser } from '@/lib/firebase/auth'
import { touchFriendly } from '@/lib/responsive'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function MobileNav() {
  const { dbUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    await signOutUser()
    clearAuth()
    navigate('/')
  }

  const getNavItems = (): NavItem[] => {
    if (!dbUser) return []
    
    const baseItems: NavItem[] = [
      { label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
    ]

    if (dbUser.role === 'student' || dbUser.role === 'alumni') {
      baseItems.push(
        { label: 'Community', href: '/community', icon: <Users className="w-5 h-5" /> },
        { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
        { label: 'Tasks', href: '/tasks', icon: <Briefcase className="w-5 h-5" /> },
        { label: 'Events', href: '/events', icon: <Calendar className="w-5 h-5" /> },
      )
    }

    if (dbUser.role === 'super_admin' || dbUser.role === 'sub_admin') {
      baseItems.push(
        { label: 'Dashboard', href: '/dashboard/admin', icon: <Settings className="w-5 h-5" /> },
        { label: 'Moderation', href: '/dashboard/admin/moderation', icon: <Users className="w-5 h-5" /> },
        { label: 'Password Resets', href: '/dashboard/admin/password-resets', icon: <Briefcase className="w-5 h-5" /> },
      )
      if (dbUser.role === 'super_admin') {
        baseItems.push(
          { label: 'Users', href: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
          { label: 'Approvals', href: '/dashboard/admin/approvals', icon: <Briefcase className="w-5 h-5" /> },
        )
      }
    }

    return baseItems
  }

  return (
    <>
      {/* Mobile Menu Button - Touch friendly */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm ${touchFriendly.button}`}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer - Touch friendly with responsive padding */}
          <div className="fixed top-14 sm:top-16 lg:top-20 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 z-50 lg:hidden max-h-[calc(100vh-56px)] sm:max-h-[calc(100vh-64px)] overflow-y-auto transition-all duration-200 ease-in-out shadow-2xl shadow-slate-900/15 safe-bottom animate-soft-fade">
            <nav className="p-4 sm:p-6 space-y-2">
              {getNavItems().map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:bg-gray-200 dark:active:bg-slate-700"
                >
                  {item.icon}
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              ))}

              {dbUser && (
                <>
                  <div className="border-t border-gray-200 dark:border-slate-800 my-4" />
                  <Link
                    to={`/profile/${dbUser.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:bg-gray-200 dark:active:bg-slate-700"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium text-sm sm:text-base">Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200"
                  >
                    <span className="flex items-center gap-3 font-medium text-sm sm:text-base">
                      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
                      Theme Toggle
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm sm:text-base">Logout</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
