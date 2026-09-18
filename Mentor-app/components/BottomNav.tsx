'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House } from '@phosphor-icons/react/dist/ssr/House'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { BellSimple } from '@phosphor-icons/react/dist/ssr/BellSimple'
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle'
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { CreateTaskDrawer, type InternOption } from '@/components/CreateTaskDrawer'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Trang chủ', href: '/mentor-app/home', icon: House },
  { label: 'Sinh viên', href: '/mentor-app/students', icon: Users },
  { label: 'Thông báo', href: '/mentor-app/notifications', icon: BellSimple },
  { label: 'Cá nhân', href: '/mentor-app/profile', icon: UserCircle },
]

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: 'bold' | 'fill' }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-1',
        'transition-transform duration-150 active:scale-90',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-5" weight={active ? 'fill' : 'bold'} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}

export function BottomNav({ interns }: { interns?: InternOption[] }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-background/90 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <div className="mx-auto grid h-16 w-full max-w-[430px] grid-cols-5 items-center">
          {tabs.slice(0, 2).map((tab) => (
            <TabLink key={tab.href} {...tab} active={isTabActive(pathname, tab.href)} />
          ))}

          <div className="flex h-full justify-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Giao việc nhanh"
              className="-translate-y-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-150 active:scale-90"
            >
              <Plus className="size-6" weight="bold" />
            </button>
          </div>

          {tabs.slice(2).map((tab) => (
            <TabLink key={tab.href} {...tab} active={isTabActive(pathname, tab.href)} />
          ))}
        </div>
      </nav>

      <CreateTaskDrawer open={drawerOpen} onOpenChange={setDrawerOpen} interns={interns} />
    </>
  )
}