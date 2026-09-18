'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { SessionProfile } from '@/lib/session'
import type { InternOption } from '@/components/CreateTaskDrawer'
import { Avatar } from './avatar'
import { BottomNav } from '@/components/BottomNav'
import { NotificationBadge } from './notification-badge'
import { ToastProvider } from '@/components/ui/toast'

const pageTitles: Record<string, string> = {
  '/mentor-app/home': 'Trang chủ',
  '/mentor-app/students': 'Sinh viên',
  '/mentor-app/tasks': 'Việc cần làm',
  '/mentor-app/notifications': 'Thông báo',
  '/mentor-app/profile': 'Cá nhân',
}

function getPageTitle(pathname: string): string {
  const match = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))
  return match ? match[1] : 'Mentor App'
}

export function MobileShell({
  profile,
  interns,
  children,
}: {
  profile: SessionProfile
  interns: InternOption[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHome = pathname === '/mentor-app/home'

  return (
    <ToastProvider>
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        {!isHome && (
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <Avatar src={profile.avatar_url} name={profile.full_name} size={32} />
              <span className="text-sm font-semibold tracking-tight">Mentor App</span>
            </div>
            <NotificationBadge
              userId={profile.id}
              internIds={interns.map((i) => i.id)}
            />
          </header>
        )}

        {/* Page Title */}
        {!isHome && (
          <div className="shrink-0 px-4 pt-3 pb-1">
            <h1 className="text-lg font-semibold tracking-tight">
              {getPageTitle(pathname)}
            </h1>
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="flex-1 overflow-y-auto scrollbar-none px-4 pb-24"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Bottom Navigation (with center FAB) */}
        <BottomNav interns={interns} />
      </div>
    </ToastProvider>
  )
}