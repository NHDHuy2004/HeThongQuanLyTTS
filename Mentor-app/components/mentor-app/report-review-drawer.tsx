'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip'
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/mentor-app/avatar'
import { useToast } from '@/components/ui/toast'
import { reworkPeriodicReport, reviewPeriodicReport } from '@/lib/actions/reports'
import { formatRelativeTime, formatTime } from '@/lib/format'

export interface ReportRow {
  id: string
  status: string
  period_number: number | null
  due_date: string | null
  attachment_url: string | null
  content: string | null
  submitted_at: string | null
  created_at: string
  report_interval_days: number | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function periodLabel(period: number | null, intervalDays: number | null) {
  const kind = intervalDays === 7 ? 'Tuần' : 'Đợt'
  return `Báo cáo ${kind} ${period ?? '-'}`
}

export function ReportReviewDrawer({
  report,
  open,
  onOpenChange,
}: {
  report: ReportRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [pending, setPending] = useState<'approve' | 'rework' | null>(null)

  const hasAttachment = report?.attachment_url && report.attachment_url.trim().length > 0
  const canSubmit = feedback.trim().length >= 3 && !pending

  async function handleApprove() {
    if (!report) return
    setPending('approve')
    const res = await reviewPeriodicReport({
      report_id: report.id,
      feedback: feedback.trim(),
    })
    setPending(null)
    if (res.success) {
      toast('Đã duyệt báo cáo!')
      router.refresh()
      onOpenChange(false)
    } else {
      toast(res.error ?? 'Không thể duyệt báo cáo', 'error')
    }
  }

  async function handleRework() {
    if (!report) return
    setPending('rework')
    const res = await reworkPeriodicReport({
      report_id: report.id,
      feedback: feedback.trim(),
    })
    setPending(null)
    if (res.success) {
      toast('Đã yêu cầu sinh viên nộp lại')
      router.refresh()
      onOpenChange(false)
    } else {
      toast(res.error ?? 'Không thể yêu cầu nộp lại', 'error')
    }
  }

  const isLate =
    report && report.submitted_at && report.due_date
      ? new Date(report.submitted_at).getTime() > new Date(report.due_date).getTime()
      : false

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />

        <DrawerTitle className="sr-only">
          {report ? periodLabel(report.period_number, report.report_interval_days) : 'Báo cáo'}
        </DrawerTitle>

        <div
          data-vaul-no-drag
          className="flex-1 space-y-4 overflow-y-auto scrollbar-none px-4 pb-4 pt-2"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={report?.profiles?.avatar_url}
                name={report?.profiles?.full_name ?? '?'}
                size={40}
                className="rounded-full border border-border"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {report?.profiles?.full_name ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(report?.due_date) ? `Hạn: ${formatDate(report?.due_date)}` : 'Không có hạn nộp'}
                </p>
              </div>
            </div>
            <Badge variant={isLate ? 'danger' : 'info'} className="shrink-0 text-[10px]">
              {isLate ? 'Nộp trễ' : 'Nộp đúng hạn'}
            </Badge>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1.5">
              <CalendarBlank className="size-3.5" weight="bold" />
              Nộp {report?.submitted_at ? formatRelativeTime(report.submitted_at) : '-'}
            </span>
            {report?.submitted_at && (
              <span>({formatTime(report.submitted_at)})</span>
            )}
          </div>

          {/* Attachment */}
          {hasAttachment && (
            <a
              href={report!.attachment_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-primary transition-colors"
            >
              <Paperclip className="size-4 shrink-0" weight="bold" />
              <span className="min-w-0 flex-1 truncate">{report!.attachment_url}</span>
              <ArrowSquareOut className="size-4 shrink-0" weight="bold" />
            </a>
          )}

          {/* Content */}
          {report?.content && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Nội dung báo cáo</p>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-sm leading-relaxed">
                {report.content}
              </p>
            </div>
          )}

          {/* Feedback */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Nhận xét của Mentor</p>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {feedback.length}/2000
              </span>
            </div>
            <Textarea
              placeholder="Nhận xét, góp ý cho báo cáo này..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={2000}
              rows={3}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tối thiểu 3 ký tự trước khi gửi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="mt-auto shrink-0 gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void handleRework()}
              disabled={!canSubmit}
              className="h-11 flex-1 rounded-xl text-sm font-medium"
            >
              <ArrowCounterClockwise className="size-4" weight="bold" />
              {pending === 'rework' ? 'Đang gửi...' : 'Yêu cầu nộp lại'}
            </Button>
            <Button
              onClick={() => void handleApprove()}
              disabled={!canSubmit}
              className="h-11 flex-1 rounded-xl bg-primary text-sm font-medium"
            >
              <CheckCircle className="size-4" weight="bold" />
              {pending === 'approve' ? 'Đang duyệt...' : 'Duyệt báo cáo'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}