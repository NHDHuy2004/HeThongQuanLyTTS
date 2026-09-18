'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeEvents, type ChannelSpec } from '@/lib/hooks/use-realtime'

/**
 * Invisible component that re-renders the tasks page when a task assigned
 * to one of the mentor's interns changes.
 */
export function TasksRealtime({ internIds }: { internIds: string[] }) {
  const router = useRouter()
  const idsKey = [...internIds].sort().join(',')

  const realtimeSpecs = useMemo<ChannelSpec[]>(() => {
    if (!idsKey) return []
    return [{ table: 'tasks', filter: `assignee_id=in.(${idsKey})` }]
  }, [idsKey])

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