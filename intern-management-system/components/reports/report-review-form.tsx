'use client'

import { useEffect, useState } from 'react'
import { useActionState } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { reviewPeriodicReport } from '@/app/(dashboard)/intern/reports/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

export function ReportReviewForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(reviewPeriodicReport, initialState)
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (state.success) {
      toast('Đã lưu nhận xét cho báo cáo định kỳ!')
      queueMicrotask(() => setFeedback(''))
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  return (
    <form action={formAction} className="space-y-2 border-t border-border pt-3">
      <input type="hidden" name="report_id" value={reportId} />
      <Textarea
        name="mentor_feedback"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Nhận xét, đánh giá tiến độ và góp ý cho tuần này..."
        required
        minLength={1}
        maxLength={3000}
        className="min-h-24"
      />
      <Button size="sm" type="submit" disabled={pending} className="gap-1">
        <CheckCircle className="size-3.5" weight="bold" />
        {pending ? 'Đang lưu...' : 'Lưu nhận xét'}
      </Button>
    </form>
  )
}