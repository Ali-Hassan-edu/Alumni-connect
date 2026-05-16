// src/components/layout/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  GraduationCap, LayoutDashboard, Users, MessageSquare, Calendar,
  Bell, User, LogOut, Menu, X, Sun, Moon, Briefcase,
  ChevronDown, Shield, ClipboardList, Network
} from 'lucide-react'
import { signOutUser } from '@/lib/firebase/auth'
import { useAuthStore } from '@/lib/stores/authStore'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard/admin',            label: 'Dashboard',       icon: LayoutDashboard, roles: ['super_admin'] },
  { to: '/dashboard/alumni',           label: 'Dashboard',       icon: LayoutDashboard, roles: ['alumni'] },
  { to: '/dashboard/student',          label: 'Dashboard',       icon: LayoutDashboard, roles: ['student'] },
  { to: '/community',                  label: 'Community',       icon: MessageSquare,   roles: ['super_admin','alumni','student'] },
  { to: '/events',                     label: 'Events',          icon: Calendar,        roles: ['super_admin','alumni','student'] },
  { to: '/tasks',                      label: 'Task Board',      icon: Briefcase,       roles: ['super_admin','alumni','student'] },
  { to: '/messages',                   label: 'Messages',        icon: Network,         roles: ['super_admin','alumni','student'] },
  { to: '/notifications',              label: 'Notifications',   icon: Bell,            roles: ['super_admin','alumni','student'] },
  { to: '/dashboard/admin/users',      label: 'User Management', icon: Users,           roles: ['super_admin'] },
  { to: '/dashboard/admin/approvals',  label: 'Approvals',       icon: ClipboardList,   roles: ['super_admin'] },
]

export function Avatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${s[size]} rounded-full object-cover flex-shrink-0`} />
  return (
    <div className={`${s[size]} rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { dbUser, clearAuth } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const role = dbUser?.role || 'student'
  const navItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    await signOutUser()
    clearAuth()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const isActive = (to: string) => {
    if (to === '/dashboard/admin' || to === '/dashboard/alumni' || to === '/dashboard/student') {
      return location.pathname === to
    }
    return location.pathname.startsWith(to)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">Alumni Connect</div>
            <div className="text-xs text-muted-foreground capitalize">{role.replace('_', ' ')}</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {role === 'super_admin' && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Super Admin Panel</span>
          </div>
        )}
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={`nav-item ${isActive(to) ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        {dbUser && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-accent transition-colors"
            >
              <Avatar name={dbUser.full_name} imageUrl={dbUser.profile_picture_url} size="sm" />
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{dbUser.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{dbUser.email}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg overflow-hidden z-50">
                <Link to={`/profile/${dbUser.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                  <User className="w-4 h-4" /> View Profile
                </Link>
                <button onClick={toggleTheme} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="border-t border-border" />
                <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent z-10">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-sm">Alumni Connect</span>
          </div>
          <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-accent">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
