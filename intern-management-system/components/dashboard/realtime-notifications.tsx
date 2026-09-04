'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function RealtimeNotifications() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, () => setCount((value) => value + 1))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leave_requests' }, () => setCount((value) => value + 1))
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={`Thông báo${count ? `, ${count} mới` : ''}`} onClick={() => setCount(0)}><Bell className="size-5" />{count > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{count > 9 ? '9+' : count}</span>}</button>
}
