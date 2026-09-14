'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { CaretLeft } from '@phosphor-icons/react/dist/ssr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { FolderOpen } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear'
import { List } from '@phosphor-icons/react/dist/ssr/List'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { Notebook } from '@phosphor-icons/react/dist/ssr/Notebook'
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut'
import { SquaresFour } from '@phosphor-icons/react/dist/ssr/SquaresFour'
import { Star } from '@phosphor-icons/react/dist/ssr/Star'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import type { Icon } from '@phosphor-icons/react'
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

const roleNavigations: Record<Role, Array<{ label: string; href: string; icon: Icon }>> = {
  admin: [
    { label: 'Tổng quan hệ thống', href: '/admin', icon: SquaresFour },
    { label: 'Phân quyền tài khoản', href: '/admin/interns', icon: Users },
    { label: 'Quản lý công việc', href: '/admin/tasks', icon: ClipboardText },
    { label: 'Giám sát điểm danh', href: '/admin/attendance', icon: CalendarCheck },
    { label: 'Quản lý đơn nghỉ phép', href: '/admin/requests', icon: SealCheck },
    { label: 'Báo cáo đánh giá', href: '/admin/evaluations', icon: Star },
    { label: 'Kho tài liệu', href: '/admin/documents', icon: FolderOpen },
    { label: 'Cài đặt hệ thống', href: '/admin/settings', icon: Gear },
  ],
  mentor: [
    { label: 'Bàn làm việc Mentor', href: '/mentor', icon: SquaresFour },
    { label: 'Giao việc & Tiến độ', href: '/mentor/tasks', icon: ClipboardText },
    { label: 'Báo cáo định kỳ', href: '/mentor/reports', icon: Notebook },
    { label: 'Điểm danh TTS', href: '/mentor/attendance', icon: CalendarCheck },
    { label: 'Duyệt đơn nghỉ phép', href: '/mentor/requests', icon: SealCheck },
    { label: 'Đánh giá TTS', href: '/mentor/evaluations', icon: Star },
    { label: 'Đánh giá tổng quan & Chứng nhận', href: '/mentor/final-evaluations', icon: Medal },
    { label: 'Tài liệu hướng dẫn', href: '/mentor/documents', icon: FolderOpen },
    { label: 'Cài đặt cá nhân', href: '/mentor/settings', icon: Gear },
  ],
  intern: [
    { label: 'Tổng quan của tôi', href: '/intern', icon: SquaresFour },
    { label: 'Nhiệm vụ được giao', href: '/intern/tasks', icon: ClipboardText },
    { label: 'Báo cáo định kỳ', href: '/intern/reports', icon: Notebook },
    { label: 'Điểm danh hằng ngày', href: '/intern/attendance', icon: CalendarCheck },
    { label: 'Xin nghỉ phép / WFH', href: '/intern/requests', icon: SealCheck },
    { label: 'Kết quả đánh giá', href: '/intern/evaluations', icon: Star },
    { label: 'Kết quả & Chứng nhận', href: '/intern/final-evaluations', icon: Medal },
    { label: 'Tài liệu & Báo cáo', href: '/intern/documents', icon: FolderOpen },
    { label: 'Hồ sơ cá nhân', href: '/intern/settings', icon: Gear },
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
      <div className="min-h-[100dvh] bg-background text-foreground">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 print:hidden ${
            collapsed ? 'lg:w-[72px]' : 'w-64'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link
              href={`/${profile.role}`}
              className={`flex items-center gap-3 ${collapsed ? 'lg:mx-auto' : ''}`}
            >
              <Image
                src="/dlu-logo.png"
                alt="Logo Đại học Đà Lạt"
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-lg object-contain shadow-card"
              />
              <div className={`transition-opacity ${collapsed ? 'lg:hidden' : ''}`}>
                <span className="block text-sm font-bold leading-tight">ĐH Đà Lạt</span>
                <span className="block text-[11px] font-medium text-muted-foreground">
                  Quản lý Thực tập
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu"
            >
              <X />
            </Button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    collapsed ? 'lg:justify-center' : ''
                  } ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  }`}
                >
                  {active && <span className="absolute left-1 top-1/2 h-4 -translate-y-1/2 w-0.5 rounded-sm bg-primary" />}
                  <Icon className="size-4 shrink-0" weight={active ? 'bold' : 'regular'} />
                  <span className={`transition-opacity ${collapsed ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className={`m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 ${collapsed ? 'lg:p-2' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
              <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm font-medium">{profile.full_name}</p>
                <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {roleLabels[profile.role]}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <div className={`transition-all duration-200 print:!pl-0 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm print:hidden sm:px-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <List />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Thu gọn sidebar"
              >
                {collapsed ? <CaretRight /> : <CaretLeft />}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Đại học Đà Lạt - Quản lý Thực tập
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RealtimeNotifications />
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-accent">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </span>
                  <div className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm font-medium leading-none">
                      {profile.full_name}
                    </span>
                    <span className="mt-1 inline-block text-[10px] font-medium text-muted-foreground">
                      {roleLabels[profile.role]}
                    </span>
                  </div>
                </summary>
                <div className="absolute right-0 top-12 w-56 rounded-lg border border-border bg-popover p-2 shadow-card-hover">
                  <div className="border-b border-border px-3 pb-3 pt-1">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground break-words">{profile.email}</p>
                    <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {roleLabels[profile.role]}
                    </span>
                  </div>
                  <form action={logout}>
                    <Button
                      type="submit"
                      variant="ghost"
                      className="mt-1 w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <SignOut className="size-4" weight="bold" />
                      Đăng xuất
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          </header>
          <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}