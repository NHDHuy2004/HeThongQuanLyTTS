'use client'

import { useEffect, useState } from 'react'
import { Bell } from '@phosphor-icons/react/dist/ssr/Bell'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function RealtimeNotifications() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, () => setCount((value) => value + 1))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leave_requests' }, () => setCount((value) => value + 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'periodic_reports' }, () => setCount((value) => value + 1))
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={count > 0 ? `Thông báo mới, ${count}` : 'Thông báo'}
      onClick={() => setCount(0)}
    >
      <Bell className="size-5" weight="duotone" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground tabular-nums">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  )
}