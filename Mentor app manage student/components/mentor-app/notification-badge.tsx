'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BellSimple } from '@phosphor-icons/react/dist/ssr/BellSimple'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeEvents, type ChannelSpec } from '@/lib/hooks/use-realtime'

/**
 * Live bell icon with an actionable-items badge for the mentor.
 * Counts pending leave requests + tasks under review + submitted periodic reports.
 */
export function NotificationBadge({
  userId,
  internIds,
}: {
  userId: string
  internIds: string[]
}) {
  const [count, setCount] = useState(0)

  const idsKey = [...internIds].sort().join(',')

  const refresh = useCallback(async () => {
    const supabase = createClient()
    let total = 0

    const { count: pendingLeaves } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', userId)
      .eq('status', 'pending')
    total += pendingLeaves ?? 0

    if (idsKey) {
      const ids = idsKey.split(',')
      const { count: underReview } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('assignee_id', ids)
        .eq('status', 'under_review')
      total += underReview ?? 0

      const { count: submittedReports } = await supabase
        .from('periodic_reports')
        .select('*', { count: 'exact', head: true })
        .in('intern_id', ids)
        .eq('status', 'submitted')
      total += submittedReports ?? 0
    }

    setCount(total)
  }, [userId, idsKey])

  const realtimeSpecs = useMemo<ChannelSpec[]>(() => {
    const specs: ChannelSpec[] = [{ table: 'leave_requests', filter: `mentor_id=eq.${userId}` }]
    if (idsKey) {
      specs.push({ table: 'tasks', filter: `assignee_id=in.(${idsKey})` })
      specs.push({ table: 'periodic_reports', filter: `intern_id=in.(${idsKey})` })
    }
    return specs
  }, [userId, idsKey])

  const timerRef = useRef<number | null>(null)
  const debouncedRefresh = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void refresh()
    }, 400)
  }, [refresh])

  useRealtimeEvents(realtimeSpecs, debouncedRefresh)

  useEffect(() => {
    function refetch() {
      void refresh()
    }
    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', refetch)
    return () => {
      window.removeEventListener('focus', refetch)
      document.removeEventListener('visibilitychange', refetch)
    }
  }, [refresh])

  return (
    <a
      href="/mentor-app/notifications"
      className="relative flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      aria-label={`Thông báo${count > 0 ? `, ${count} việc cần xử lý` : ''}`}
    >
      <BellSimple className="size-5 text-muted-foreground" weight="bold" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 leading-[18px] text-[10px] font-semibold text-destructive-foreground tabular-nums">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  )
}