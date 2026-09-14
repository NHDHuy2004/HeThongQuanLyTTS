'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip'
import { BottomSheet } from './bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from './avatar'
import { useToast } from '@/components/ui/toast'
import { reviewPeriodicReport } from '@/lib/actions/reports'
import { formatRelativeTime } from '@/lib/format'

export interface ReportForReview {
  id: string
  status: string
  period_number: number | null
  due_date: string | null
  attachment_url: string | null
  content: string | null
  submitted_at: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ReviewReportSheet({
  report,
  onClose,
}: {
  report: ReportForReview | null
  onClose: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [pending, setPending] = useState(false)

  const hasAttachment = report?.attachment_url && report.attachment_url.trim().length > 0
  const canSubmit = feedback.trim().length >= 3 && !pending

  async function handleSubmit() {
    if (!report) return
    setPending(true)
    const res = await reviewPeriodicReport({
      report_id: report.id,
      feedback: feedback.trim(),
    })
    setPending(false)
    if (res.success) {
      toast('Da phan hoi bao cao!')
      router.refresh()
      onClose()
    } else {
      toast(res.error ?? 'Khong the gui phan hoi.', 'error')
    }
  }

  return (
    <BottomSheet open={report !== null} onClose={onClose} title="Phan hoi bao cao dinh ky">
      {report && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={report.profiles?.avatar_url}
                name={report.profiles?.full_name ?? '?'}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {report.profiles?.full_name ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ky {report.period_number ?? 1}
                </p>
              </div>
            </div>
            <Badge variant="info" className="shrink-0 text-[10px]">Da nop</Badge>
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {report.due_date && (
              <span className="flex items-center gap-1.5">
                <CalendarBlank className="size-3.5" weight="bold" />
                Han: {formatDate(report.due_date)}
              </span>
            )}
            {report.submitted_at && (
              <span>Nop {formatRelativeTime(report.submitted_at)}</span>
            )}
          </div>

          {/* Attachment */}
          {hasAttachment && (
            <a
              href={report.attachment_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <Paperclip className="size-4 shrink-0" weight="bold" />
              <span className="min-w-0 flex-1 truncate">{report.attachment_url}</span>
              <ArrowSquareOut className="size-4 shrink-0" weight="bold" />
            </a>
          )}

          {/* Content */}
          {report.content && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Noi dung bao cao</p>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm leading-relaxed">
                {report.content}
              </p>
            </div>
          )}

          {/* Feedback */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Phan hoi cua ban</p>
              <span className="text-[10px] text-muted-foreground tabular-nums">{feedback.length}/2000</span>
            </div>
            <Textarea
              placeholder="Nhan xet, gop y cho bao cao nay..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={2000}
              rows={3}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Toi thieu 3 ky tu truoc khi gui.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="mt-5 h-12 w-full gap-2 text-base"
          >
            <CheckCircle className="size-5" weight="bold" />
            {pending ? 'Dang gui...' : 'Gui phan hoi'}
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}