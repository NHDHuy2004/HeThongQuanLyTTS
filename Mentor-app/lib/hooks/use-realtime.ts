'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChannelSpec {
  table: string
  filter: string
}

/**
 * Subscribes to Supabase realtime changes across several tables on a single channel.
 * `onEvent` is fired on any change AND once after the channel subscribes (initial sync).
 * It is kept in a ref so the subscription only re-establishes when `specs` changes.
 */
export function useRealtimeEvents(specs: ChannelSpec[], onEvent: () => void) {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (specs.length === 0) return

    const supabase = createClient()
    const channelName = `realtime-${Math.random().toString(36).slice(2, 10)}`
    const channel = supabase.channel(channelName)

    for (const spec of specs) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: spec.table,
          filter: spec.filter,
        },
        () => {
          onEventRef.current()
        },
      )
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') onEventRef.current()
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [specs])
}