'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Star,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { RealtimeNotifications } from './realtime-notifications'
import { ToastProvider } from '@/components/ui/toast'

type Role = 'admin' | 'mentor' | 'intern'
type Profile = { full_name: string; email: string; role: Role; avatar_url: string | null }

const roleLabels: Record<Role, string> = {
  admin: 'Quản trị viên',
  mentor: 'Mentor',
  intern: 'Thực tập sinh',
}

const roleBadgeColors: Record<Role, string> = {
  admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40',
  mentor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40',
  intern: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40',
}

const roleNavigations: Record<Role, Array<{ label: string; href: string; icon: typeof LayoutDashboard }>> = {
  admin: [
    { label: 'Tổng quan hệ thống', href: '/admin', icon: LayoutDashboard },
    { label: 'Phân quyền tài khoản', href: '/admin/interns', icon: Users },
    { label: 'Quản lý công việc', href: '/admin/tasks', icon: ClipboardCheck },
    { label: 'Giám sát điểm danh', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Quản lý đơn nghỉ phép', href: '/admin/requests', icon: FileCheck2 },
    { label: 'Báo cáo đánh giá', href: '/admin/evaluations', icon: Star },
    { label: 'Kho tài liệu', href: '/admin/documents', icon: FolderOpen },
    { label: 'Cài đặt hệ thống', href: '/admin/settings', icon: Settings },
  ],
  mentor: [
    { label: 'Bàn làm việc Mentor', href: '/mentor', icon: LayoutDashboard },
    { label: 'Giao việc & Tiến độ', href: '/mentor/tasks', icon: ClipboardCheck },
    { label: 'Điểm danh TTS', href: '/mentor/attendance', icon: CalendarCheck },
    { label: 'Duyệt đơn nghỉ phép', href: '/mentor/requests', icon: FileCheck2 },
    { label: 'Đánh giá TTS', href: '/mentor/evaluations', icon: Star },
    { label: 'Tài liệu hướng dẫn', href: '/mentor/documents', icon: FolderOpen },
    { label: 'Cài đặt cá nhân', href: '/mentor/settings', icon: Settings },
  ],
  intern: [
    { label: 'Tổng quan của tôi', href: '/intern', icon: LayoutDashboard },
    { label: 'Nhiệm vụ được giao', href: '/intern/tasks', icon: ClipboardCheck },
    { label: 'Điểm danh hằng ngày', href: '/intern/attendance', icon: CalendarCheck },
    { label: 'Xin nghỉ phép / WFH', href: '/intern/requests', icon: FileCheck2 },
    { label: 'Kết quả đánh giá', href: '/intern/evaluations', icon: Star },
    { label: 'Tài liệu & Báo cáo', href: '/intern/documents', icon: FolderOpen },
    { label: 'Hồ sơ cá nhân', href: '/intern/settings', icon: Settings },
  ],
}

export function DashboardShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const initials = profile.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(-2)
    .toUpperCase()

  const items = roleNavigations[profile.role] ?? roleNavigations.intern

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/mentor' || href === '/intern' || href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-emerald-950/[0.02] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-emerald-900/10 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
            collapsed ? 'lg:w-[72px]' : 'w-64'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-emerald-900/10 px-4 dark:border-slate-800">
            <Link
              href={`/${profile.role}`}
              className={`flex items-center gap-3 font-semibold ${collapsed ? 'lg:mx-auto' : ''}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 via-green-600 to-amber-500 text-xs font-black text-white shadow-sm ring-1 ring-black/5">
                DLU
              </span>
              <div className={`transition-opacity ${collapsed ? 'lg:hidden' : ''}`}>
                <span className="block text-sm font-bold text-emerald-900 dark:text-emerald-100 leading-tight">
                  ĐH Đà Lạt
                </span>
                <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Quản lý Thực tập
                </span>
              </div>
            </Link>
            <button
              className="text-slate-500 hover:text-slate-700 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    collapsed ? 'lg:justify-center' : ''
                  } ${
                    active
                      ? 'bg-emerald-50/90 text-emerald-800 font-semibold shadow-xs dark:bg-emerald-950/60 dark:text-emerald-200'
                      : 'text-slate-600 hover:bg-emerald-50/40 hover:text-emerald-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${active ? 'text-emerald-700 dark:text-emerald-400' : ''}`} />
                  <span className={`transition-opacity ${collapsed ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                  {active && !collapsed && (
                    <span className="ml-auto size-2 rounded-full bg-amber-500 shadow-xs" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Card */}
          <div className={`m-3 rounded-xl bg-emerald-50/50 border border-emerald-900/5 p-3 dark:bg-slate-800/60 dark:border-slate-700 ${collapsed ? 'lg:p-2' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 via-green-600 to-amber-500 text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className={collapsed ? 'lg:hidden' : ''}>
                <p className="truncate text-sm font-medium">{profile.full_name}</p>
                <span
                  className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[profile.role]}`}
                >
                  {roleLabels[profile.role]}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-900/10 bg-white/90 px-4 backdrop-blur-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <Menu />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Thu gọn sidebar"
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
              <span className="text-sm font-medium text-emerald-900/80 dark:text-emerald-300 flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                Đại học Đà Lạt • Quản lý Thực tập
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RealtimeNotifications />
              {/* User dropdown */}
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-emerald-50/50 dark:hover:bg-slate-800">
                  <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-amber-500 text-xs font-bold text-white shadow-xs">
                    {initials}
                  </span>
                  <div className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm font-medium leading-none">
                      {profile.full_name}
                    </span>
                    <span className={`inline-block mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-tight ${roleBadgeColors[profile.role]}`}>
                      {roleLabels[profile.role]}
                    </span>
                  </div>
                </summary>
                <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-3 pb-3 pt-1 dark:border-slate-800">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[profile.role]}`}>
                      {roleLabels[profile.role]}
                    </span>
                  </div>
                  <form action={logout}>
                    <button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                      <LogOut className="size-4" />
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </header>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}