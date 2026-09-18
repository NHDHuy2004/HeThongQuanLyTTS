'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { reviewTaskSubmission } from '@/lib/actions/tasks'

export function ApproveButton({ taskId }: { taskId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleApprove() {
    setPending(true)
    const res = await reviewTaskSubmission({ task_id: taskId, decision: 'approved' })
    setPending(false)
    if (res.success) {
      toast('Đã duyệt nhanh bài nộp!')
      router.refresh()
    } else {
      toast(res.error ?? 'Không thể duyệt bài nộp', 'error')
    }
  }

  return (
    <Button
      onClick={handleApprove}
      disabled={pending}
      size="sm"
      className="flex-1 rounded-xl bg-primary"
    >
      <CheckCircle className="size-3.5" weight="bold" />
      {pending ? 'Đang duyệt...' : 'Duyệt nhanh'}
    </Button>
  )
}