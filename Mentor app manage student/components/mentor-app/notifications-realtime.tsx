'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeEvents, type ChannelSpec } from '@/lib/hooks/use-realtime'

/**
 * Invisible component that re-renders the notifications page when
 * leave requests, task submissions or periodic reports change.
 */
export function NotificationsRealtime({
  userId,
  internIds,
}: {
  userId: string
  internIds: string[]
}) {
  const router = useRouter()
  const idsKey = [...internIds].sort().join(',')

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
      router.refresh()
    }, 400)
  }, [router])

  useRealtimeEvents(realtimeSpecs, debouncedRefresh)

  useEffect(() => {
    function refetch() {
      router.refresh()
    }
    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', refetch)
    return () => {
      window.removeEventListener('focus', refetch)
      document.removeEventListener('visibilitychange', refetch)
    }
  }, [router])

  return null
}