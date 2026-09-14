'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import type { ReactNode } from 'react'
import { Check } from '@phosphor-icons/react/dist/ssr/Check'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import { reviewRequest } from '@/app/(dashboard)/intern/requests/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

export function ReviewRequestButton({
  requestId,
  status,
  children,
}: {
  requestId: string
  status: 'approved' | 'rejected'
  children: ReactNode
}) {
  const [state, formAction, pending] = useActionState(reviewRequest, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast(status === 'approved' ? 'Đã duyệt đơn!' : 'Đã từ chối đơn.')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast, status])

  return (
    <form action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="status" value={status} />
      <Button
        size="sm"
        type="submit"
        variant={status === 'approved' ? 'default' : 'destructive'}
        disabled={pending}
      >
        {status === 'approved' ? <Check className="size-3.5" weight="bold" /> : <X className="size-3.5" weight="bold" />}
        {children}
      </Button>
    </form>
  )
}