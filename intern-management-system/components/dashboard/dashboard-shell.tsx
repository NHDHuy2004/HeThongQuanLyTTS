'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ClipboardCheck, FileCheck2, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { RealtimeNotifications } from './realtime-notifications'

type Role = 'admin' | 'mentor' | 'intern'
type Profile = { full_name: string; email: string; role: Role; avatar_url: string | null }

const roleLabels: Record<Role, string> = { admin: 'Quản trị viên', mentor: 'Mentor', intern: 'Thực tập sinh' }

const navigation = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Công việc', href: '/dashboard/tasks', icon: ClipboardCheck, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Phân quyền', href: '/admin/interns', icon: Users, roles: ['admin'] },
  { label: 'Điểm danh', href: '/dashboard/attendance', icon: ClipboardCheck, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Cài đặt', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Đơn nghỉ phép', href: '/dashboard/requests', icon: FileCheck2, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Đánh giá', href: '/dashboard/evaluations', icon: Users, roles: ['admin', 'mentor', 'intern'] },
  { label: 'Tài liệu', href: '/dashboard/documents', icon: ClipboardCheck, roles: ['admin', 'mentor', 'intern'] },
]

export function DashboardShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = profile.full_name.split(' ').map((part) => part[0]).join('').slice(-2).toUpperCase()
  const items = navigation.filter((item) => item.roles.includes(profile.role))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${collapsed ? 'lg:w-20' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <a href="/dashboard" className={`flex items-center gap-3 font-semibold ${collapsed ? 'lg:mx-auto' : ''}`}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">IT</span>
            <span className={collapsed ? 'lg:hidden' : ''}>Intern Hub</span>
          </a>
          <button className="text-slate-500 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const Icon = item.icon
            return <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300 ${collapsed ? 'lg:justify-center' : ''}`}><Icon className="size-4 shrink-0" /><span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span></a>
          })}
        </nav>
        <div className={`m-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800 ${collapsed ? 'lg:p-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-200">{initials}</div>
            <div className={collapsed ? 'lg:hidden' : ''}><p className="truncate text-sm font-medium">{profile.full_name}</p><p className="text-xs text-slate-500">{roleLabels[profile.role]}</p></div>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] lg:pl-64 ${collapsed ? 'lg:pl-20' : ''}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu /></Button><Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setCollapsed(!collapsed)} aria-label="Thu gọn sidebar">{collapsed ? <ChevronRight /> : <ChevronLeft />}</Button><span className="text-sm text-slate-500">Không gian làm việc</span></div>
          <div className="flex items-center gap-2"><RealtimeNotifications /><details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><span className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{initials}</span><span className="hidden max-w-32 truncate text-sm font-medium sm:block">{profile.full_name}</span></summary><div className="absolute right-0 top-11 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"><p className="border-b border-slate-100 px-2 pb-2 text-xs text-slate-500 dark:border-slate-800">{profile.email}</p><form action={logout}><button className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"><LogOut className="size-4" />Đăng xuất</button></form></div></details></div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}