'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { Badge, statusLabel, statusVariant } from '@/components/ui/badge'
import { EmptyState } from '@/components/mentor-app/empty-state'
import {
  ReviewRequestSheet,
  type LeaveRequestDetail,
} from '@/components/mentor-app/review-request-sheet'
import {
  ReviewTaskSheet,
  type TaskForReview,
} from '@/components/mentor-app/review-task-sheet'
import {
  ReviewReportSheet,
  type ReportForReview,
} from '@/components/mentor-app/review-report-sheet'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface FeedItem {
  id: string
  title: string
  subtitle: string
  status: string
  time: string
  type: 'request' | 'task' | 'report'
}

const notifIcons = {
  request: CalendarCheck,
  task: ClipboardText,
  report: FileText,
} as const

export function NotificationFeed({
  requests,
  tasks,
  reports,
}: {
  requests: LeaveRequestDetail[]
  tasks: TaskForReview[]
  reports: ReportForReview[]
}) {
  const [activeRequest, setActiveRequest] = useState<LeaveRequestDetail | null>(null)
  const [activeTask, setActiveTask] = useState<TaskForReview | null>(null)
  const [activeReport, setActiveReport] = useState<ReportForReview | null>(null)

  const items = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [
      ...requests.map((r) => ({
        id: r.id,
        title: r.type === 'leave' ? 'Xin nghi phep' : 'Xin WFH',
        subtitle: `${r.profiles?.full_name ?? 'N/A'} - ${r.start_date} den ${r.end_date}`,
        status: r.status,
        time: r.created_at,
        type: 'request' as const,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        title: `Nop bai: ${t.title}`,
        subtitle: t.profiles?.full_name ?? 'N/A',
        status: t.status,
        time: t.submitted_at ?? '',
        type: 'task' as const,
      })),
      ...reports.map((r) => ({
        id: r.id,
        title: `Bao cao dinh ky${r.period_number ? ` (Ky ${r.period_number})` : ''}`,
        subtitle: `${r.profiles?.full_name ?? 'N/A'} - Can phan hoi`,
        status: r.status,
        time: r.submitted_at ?? r.created_at,
        type: 'report' as const,
      })),
    ]
    return merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }, [requests, tasks, reports])

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Chua co thong bao"
        description="Thong bao moi se hien thi tai day."
      />
    )
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((notif) => {
          const Icon = notifIcons[notif.type]
          const isRequestActionable = notif.type === 'request' && notif.status === 'pending'
          const isTask = notif.type === 'task'
          const isReport = notif.type === 'report'
          const content = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" weight="bold" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{notif.title}</p>
                  {notif.type === 'request' && notif.status === 'pending' && (
                    <Badge variant="warning" className="shrink-0 text-[10px]">Moi</Badge>
                  )}
                  {notif.type === 'request' && notif.status !== 'pending' && (
                    <Badge variant={statusVariant(notif.status)} className="shrink-0 text-[10px]">
                      {statusLabel(notif.status)}
                    </Badge>
                  )}
                  {notif.type === 'task' && (
                    <Badge variant={statusVariant(notif.status)} className="shrink-0 text-[10px]">
                      {statusLabel(notif.status)}
                    </Badge>
                  )}
                  {notif.type === 'report' && (
                    <Badge variant="info" className="shrink-0 text-[10px]">Da nop</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{notif.subtitle}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatRelativeTime(notif.time)}
              </span>
            </>
          )

          if (isTask) {
            const task = tasks.find((t) => t.id === notif.id)
            if (!task) return null
            return (
              <button
                key={`${notif.type}-${notif.id}`}
                onClick={() => setActiveTask(task)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors active:scale-[0.99]"
              >
                {content}
              </button>
            )
          }

          if (isReport) {
            const report = reports.find((r) => r.id === notif.id)
            if (!report) return null
            return (
              <button
                key={`${notif.type}-${notif.id}`}
                onClick={() => setActiveReport(report)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors active:scale-[0.99]"
              >
                {content}
              </button>
            )
          }

          if (isRequestActionable) {
            const request = requests.find((r) => r.id === notif.id)
            if (!request) return null
            return (
              <button
                key={`${notif.type}-${notif.id}`}
                onClick={() => setActiveRequest(request)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors active:scale-[0.99]"
              >
                {content}
              </button>
            )
          }

          return (
            <div
              key={`${notif.type}-${notif.id}`}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card',
                notif.type === 'request' && 'opacity-70',
              )}
            >
              {content}
            </div>
          )
        })}
      </div>

      <ReviewRequestSheet
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
      />
      <ReviewTaskSheet task={activeTask} onClose={() => setActiveTask(null)} />
      <ReviewReportSheet report={activeReport} onClose={() => setActiveReport(null)} />
    </>
  )
}