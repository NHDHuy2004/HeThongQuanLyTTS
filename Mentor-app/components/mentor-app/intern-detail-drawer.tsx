'use client'

import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { Phone } from '@phosphor-icons/react/dist/ssr/Phone'
import { ChatsCircle } from '@phosphor-icons/react/dist/ssr/ChatsCircle'
import { Building } from '@phosphor-icons/react/dist/ssr/Building'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Avatar } from '@/components/mentor-app/avatar'
import { Badge, statusLabel, statusVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/format'

export interface InternReport {
  period_number: number | null
  status: string
  submitted_at: string | null
}

export interface InternRow {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  university: string | null
  major: string | null
  start_date: string | null
  end_date: string | null
  internship_status: string
  department: string | null
  task_total: number
  task_completed: number
  overdue_count: number
  phone?: string | null
  reports: InternReport[]
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function InternDetailDrawer({
  intern,
  open,
  onOpenChange,
  onCreateTask,
}: {
  intern: InternRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (intern: InternRow) => void
}) {
  if (!intern) return null

  const status = intern.internship_status === 'completed_internship' ? 'completed_internship' : intern.overdue_count > 0 ? 'attention' : 'active'

  const badgeConfig = {
    attention: { label: 'Cần chú ý', variant: 'danger' as const },
    active: { label: 'Đang làm', variant: 'success' as const },
    completed_internship: { label: 'Hoàn thành', variant: 'primary' as const },
  }[status]

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />

        <DrawerTitle className="sr-only">Hồ sơ {intern.full_name}</DrawerTitle>

        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <Avatar src={intern.avatar_url} name={intern.full_name} size={56} className="rounded-full border border-border" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-bold tracking-tight">{intern.full_name}</p>
              <Badge variant={badgeConfig.variant} className="shrink-0 text-[10px]">
                {badgeConfig.label}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{intern.email}</p>
            {intern.university && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {intern.university}{intern.major ? ` - ${intern.major}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          data-vaul-no-drag
          className="flex-1 space-y-5 overflow-y-auto scrollbar-none px-4 pb-4"
        >
          {/* Liên hệ nhanh */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Liên hệ nhanh</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`mailto:${intern.email}`}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium transition-transform active:scale-[0.98]"
              >
                <EnvelopeSimple className="size-4" weight="bold" />
                Email
              </a>
              {intern.phone ? (
                <a
                  href={`tel:${intern.phone}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium transition-transform active:scale-[0.98]"
                >
                  <Phone className="size-4" weight="bold" />
                  Gọi
                </a>
              ) : (
                <a
                  href={`mailto:${intern.email}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium transition-transform active:scale-[0.98]"
                >
                  <ChatsCircle className="size-4" weight="bold" />
                  Nhắn tin
                </a>
              )}
            </div>
          </section>

          {/* Thông tin hợp đồng */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Thông tin hợp đồng</p>
            <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-3.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Building className="size-4 shrink-0 text-muted-foreground" weight="bold" />
                <span className="min-w-0 flex-1 truncate">{intern.department ?? 'Chưa phân khoa'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <CalendarBlank className="size-4 shrink-0 text-muted-foreground" weight="bold" />
                <span className="tabular-nums">
                  {formatDate(intern.start_date) ?? '--'} đến {formatDate(intern.end_date) ?? '--'}
                </span>
              </div>
            </div>
          </section>

          {/* Lịch sử báo cáo */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Báo cáo định kỳ ({intern.reports.length})
            </p>
            {intern.reports.length > 0 ? (
              <div className="space-y-2">
                {intern.reports.slice(0, 6).map((rpt) => (
                  <div
                    key={`${rpt.period_number}-${rpt.submitted_at}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText className="size-4" weight="bold" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">Kỳ {rpt.period_number ?? '-'}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
                          {rpt.submitted_at ? `Nộp ${formatRelativeTime(rpt.submitted_at)}` : 'Chưa nộp'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(rpt.status)} className="shrink-0 text-[10px]">
                      {statusLabel(rpt.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                Chưa có báo cáo nào.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <DrawerFooter className="mt-auto shrink-0 gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            onClick={() => onCreateTask(intern)}
            className="h-11 w-full rounded-xl bg-primary text-base font-medium transition-transform active:scale-[0.98]"
          >
            <PaperPlaneTilt className="size-4" weight="bold" />
            Giao task riêng
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}