import { useState } from 'react'
import { Menu, X, Home, Users, Briefcase, Calendar, MessageSquare, Settings, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/authStore'
import { supabase } from '@/lib/supabase/client'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
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

    if (dbUser.role === 'super_admin') {
      baseItems.push(
        { label: 'Dashboard', href: '/dashboard/admin', icon: <Settings className="w-5 h-5" /> },
        { label: 'Users', href: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
        { label: 'Approvals', href: '/dashboard/admin/approvals', icon: <Briefcase className="w-5 h-5" /> },
      )
    }

    return baseItems
  }

  return (
    <>
      {/* Mobile Menu Button - Touch friendly */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${touchFriendly.button}`}
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
          <div className="fixed top-14 sm:top-16 lg:top-20 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-50 lg:hidden max-h-[calc(100vh-56px)] sm:max-h-[calc(100vh-64px)] overflow-y-auto transition-all duration-200 ease-in-out">
            <nav className="p-4 sm:p-6 space-y-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:bg-gray-200 dark:active:bg-slate-700"
                >
                  {item.icon}
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              ))}

              {dbUser && (
                <>
                  <div className="border-t border-gray-200 dark:border-slate-800 my-4" />
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:bg-gray-200 dark:active:bg-slate-700"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium text-sm sm:text-base">Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30"
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
