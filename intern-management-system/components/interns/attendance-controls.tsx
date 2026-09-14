'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { checkIn, checkOut } from '@/app/(dashboard)/intern/attendance/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

export function AttendanceControls({
  canCheckIn,
  canCheckOut,
}: {
  canCheckIn: boolean
  canCheckOut: boolean
}) {
  const { toast } = useToast()
  const [inState, inAction, inPending] = useActionState(checkIn, initialState)
  const [outState, outAction, outPending] = useActionState(checkOut, initialState)

  useEffect(() => {
    if (inState.success) toast('Check-in thành công!')
    else if (inState.error) toast(inState.error, 'error')
  }, [inState, toast])

  useEffect(() => {
    if (outState.success) toast('Check-out thành công!')
    else if (outState.error) toast(outState.error, 'error')
  }, [outState, toast])

  return (
    <div className="flex items-center gap-2.5">
      <form action={inAction}>
        <Button type="submit" disabled={!canCheckIn || inPending}>
          {inPending ? 'Đang check-in...' : 'Check-in ngay'}
        </Button>
      </form>
      <form action={outAction}>
        <Button type="submit" variant="outline" disabled={!canCheckOut || outPending}>
          {outPending ? 'Đang check-out...' : 'Check-out'}
        </Button>
      </form>
    </div>
  )
}