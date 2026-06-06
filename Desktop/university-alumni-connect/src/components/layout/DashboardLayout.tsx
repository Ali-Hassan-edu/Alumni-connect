// src/components/layout/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, Calendar,
  Bell, User, LogOut, Menu, X, Sun, Moon, Briefcase,
  ChevronDown, Shield, ClipboardList, Network, Megaphone
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
  { to: '/dashboard/admin',            label: 'Dashboard',       icon: LayoutDashboard, roles: ['super_admin','sub_admin'] },
  { to: '/dashboard/alumni',           label: 'Dashboard',       icon: LayoutDashboard, roles: ['alumni'] },
  { to: '/dashboard/student',          label: 'Dashboard',       icon: LayoutDashboard, roles: ['student'] },
  { to: '/community',                  label: 'Community',       icon: MessageSquare,   roles: ['super_admin','sub_admin','alumni','student'] },
  { to: '/events',                     label: 'Events',          icon: Calendar,        roles: ['super_admin','sub_admin','alumni','student'] },
  { to: '/tasks',                      label: 'Task Board',      icon: Briefcase,       roles: ['super_admin','sub_admin','alumni','student'] },
  { to: '/messages',                   label: 'Messages',        icon: Network,         roles: ['super_admin','sub_admin','alumni','student'] },
  { to: '/notifications',              label: 'Notifications',   icon: Bell,            roles: ['super_admin','sub_admin','alumni','student'] },
  { to: '/dashboard/admin/moderation', label: 'Moderation',      icon: Shield,          roles: ['super_admin','sub_admin'] },
  { to: '/dashboard/admin/password-resets', label: 'Password Resets', icon: ClipboardList, roles: ['super_admin','sub_admin'] },
  { to: '/dashboard/admin/users',      label: 'User Management', icon: Users,           roles: ['super_admin'] },
  { to: '/dashboard/admin/approvals',  label: 'User Approvals',  icon: ClipboardList,   roles: ['super_admin'] },
  { to: '/dashboard/admin/task-approvals', label: 'Task Approvals', icon: Briefcase, roles: ['super_admin'] },
  { to: '/dashboard/admin/announcements', label: 'Announcements', icon: Megaphone, roles: ['super_admin'] },
]

export function Avatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${s[size]} rounded-full object-cover flex-shrink-0`} loading="lazy" />
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
      <div className="px-4 py-4 border-b border-border/80 bg-white/70 dark:bg-slate-950/50">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Alumni Connect" className="w-8 h-8 rounded-lg object-cover shrink-0" loading="lazy" />
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">Alumni Connect</div>
            <div className="text-xs text-muted-foreground capitalize">{role.replace('_', ' ')}</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {(role === 'super_admin' || role === 'sub_admin') && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
              {role === 'super_admin' ? 'Super Admin Panel' : 'Sub Admin Panel'}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 mb-3 rounded-xl border border-border/80 bg-white/70 dark:bg-slate-900/70 text-sm text-gray-800 dark:text-gray-200 hover:bg-accent"
        >
          <span className="flex items-center gap-3 font-medium">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            Theme Toggle
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">{isDark ? 'Light' : 'Dark'}</span>
        </button>
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
      <div className="px-3 py-3 border-t border-border/80 bg-white/70 dark:bg-slate-950/50 safe-bottom">
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
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-soft-fade">
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20 overflow-hidden">
      {/* Desktop sidebar - fixed width, always visible on lg+ */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-border/80 bg-card/90 backdrop-blur-xl shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer with backdrop */}
      {sidebarOpen && (
        <>
          {/* Backdrop - click to close, smooth fade */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-200 fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer - slides in from left with smooth animation */}
          <aside className="fixed top-0 left-0 bottom-0 w-[min(18rem,86vw)] bg-card/95 backdrop-blur-xl border-r border-border flex flex-col z-50 md:hidden transition-transform duration-300 ease-out transform translate-x-0 slide-in-left shadow-2xl shadow-slate-900/25">
            {/* Close button - positioned in top right corner, touch-friendly */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors z-10"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar content with top padding for close button */}
            <div className="pt-12">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar - visible only on mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/80 bg-card/95 backdrop-blur-xl shadow-sm safe-top">
          {/* Hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo/title */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Alumni Connect" className="w-5 h-5 rounded object-cover" loading="lazy" />
            <span className="font-bold text-sm">Alumni Connect</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Theme Toggle"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>
            {/* Notifications link */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="min-w-0 animate-soft-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
