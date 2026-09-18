'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle'
import { BottomSheet } from './bottom-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { reviewLeaveRequest } from '@/lib/actions/requests'
import { formatRelativeTime } from '@/lib/format'

export interface LeaveRequestDetail {
  id: string
  type: 'leave' | 'wfh'
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  start_date: string
  end_date: string
  created_at: string
  profiles: { full_name: string | null } | null
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ReviewRequestSheet({
  request,
  onClose,
}: {
  request: LeaveRequestDetail | null
  onClose: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, setPending] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)

  const typeLabel = request?.type === 'wfh' ? 'Xin WFH' : 'Xin nghỉ phép'

  async function handleReview(decision: 'approved' | 'rejected') {
    if (!request) return
    setPending(true)
    const res = await reviewLeaveRequest({ request_id: request.id, decision })
    setPending(false)
    if (res.success) {
      toast(decision === 'approved' ? 'Đã duyệt đơn thành công!' : 'Đã từ chối đơn.')
      router.refresh()
      onClose()
    } else {
      toast(res.error ?? 'Không thể xử lý đơn.', 'error')
    }
  }

  return (
    <BottomSheet open={request !== null} onClose={onClose} title="Duyệt đơn xin nghỉ">
      {request && (
        <div className="p-4">
          <div className="space-y-3">
            {/* Intern + type */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">
                  {request.profiles?.full_name ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gửi {formatRelativeTime(request.created_at)}
                </p>
              </div>
              <Badge variant={request.type === 'leave' ? 'warning' : 'info'} className="shrink-0">
                {typeLabel}
              </Badge>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <CalendarBlank className="size-5 shrink-0 text-primary" weight="bold" />
              <p className="text-sm font-medium tabular-nums">
                {formatDate(request.start_date)} đến {formatDate(request.end_date)}
              </p>
            </div>

            {/* Reason */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Lý do</p>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm leading-relaxed">
                {request.reason || 'Không có lý do.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              onClick={() => handleReview('approved')}
              disabled={pending || request.status !== 'pending'}
              className="h-12 w-full gap-2 text-base"
            >
              <CheckCircle className="size-5" weight="bold" />
              {pending ? 'Đang xử lý...' : 'Duyệt đơn'}
            </Button>
            <Button
              onClick={() => {
                if (!confirmReject) {
                  setConfirmReject(true)
                  return
                }
                void handleReview('rejected')
              }}
              variant="outline"
              disabled={pending || request.status !== 'pending'}
              className="h-12 w-full gap-2 border-destructive/40 text-base text-destructive hover:bg-destructive/10"
            >
              <XCircle className="size-5" weight="bold" />
              {pending ? 'Đang xử lý...' : confirmReject ? 'Xác nhận từ chối?' : 'Từ chối'}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}