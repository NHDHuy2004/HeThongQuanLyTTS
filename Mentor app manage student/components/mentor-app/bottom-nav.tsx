'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House } from '@phosphor-icons/react/dist/ssr/House'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { BellSimple } from '@phosphor-icons/react/dist/ssr/BellSimple'
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Home', href: '/mentor-app/home', icon: House },
  { label: 'Sinh vien', href: '/mentor-app/students', icon: Users },
  { label: 'Viec can lam', href: '/mentor-app/tasks', icon: CalendarCheck },
  { label: 'Thong bao', href: '/mentor-app/notifications', icon: BellSimple },
  { label: 'Ca nhan', href: '/mentor-app/profile', icon: UserCircle },
]

export function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[430px] items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-w-[48px] flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                'tap-highlight-transparent active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-label={tab.label}
            >
              <span className="relative">
                <Icon className="size-6" weight={isActive ? 'fill' : 'bold'} />
                {tab.href === '/mentor-app/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}