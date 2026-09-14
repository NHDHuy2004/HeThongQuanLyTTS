'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { SessionProfile } from '@/lib/session'
import { Avatar } from './avatar'
import { BottomNav } from './bottom-nav'
import { Fab } from './fab'
import { CreateTaskSheet, type InternOption } from './create-task-sheet'
import { NotificationBadge } from './notification-badge'
import { ToastProvider } from '@/components/ui/toast'

const pageTitles: Record<string, string> = {
  '/mentor-app/home': 'Trang chu',
  '/mentor-app/students': 'Sinh vien',
  '/mentor-app/tasks': 'Viec can lam',
  '/mentor-app/notifications': 'Thong bao',
  '/mentor-app/profile': 'Ca nhan',
}

const FAB_PAGES = ['/mentor-app/home', '/mentor-app/students', '/mentor-app/tasks']

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
  const [sheetOpen, setSheetOpen] = useState(false)

  const showFab = FAB_PAGES.some((path) => pathname.startsWith(path))

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-[100dvh] max-w-[430px] flex-col overflow-x-hidden bg-background">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <Avatar src={profile.avatar_url} name={profile.full_name} size={32} />
            <span className="text-sm font-semibold tracking-tight">Mentor App</span>
          </div>
          <NotificationBadge
            userId={profile.id}
            internIds={interns.map((i) => i.id)}
          />
        </header>

        {/* Page Title */}
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-lg font-semibold tracking-tight">
            {getPageTitle(pathname)}
          </h1>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="flex-1 overflow-y-auto px-4 pb-28 scrollbar-none"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* FAB */}
        {showFab && <Fab onClick={() => setSheetOpen(true)} />}

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Create Task Sheet */}
        <CreateTaskSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          interns={interns}
        />
      </div>
    </ToastProvider>
  )
}