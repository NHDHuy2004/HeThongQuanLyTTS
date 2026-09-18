'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/mentor-app/avatar'
import { NotificationsRealtime } from '@/components/mentor-app/notifications-realtime'
import { ReportReviewDrawer, type ReportRow } from '@/components/mentor-app/report-review-drawer'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface InternBrief {
  id: string
  full_name: string
  avatar_url: string | null
  department: string | null
}

interface AttendanceRow {
  intern_id: string
  check_in_time: string | null
  check_out_time: string | null
  total_hours: number | null
  status: string
}

type ViewKey = 'reports' | 'attendance'
type ReportFilter = 'pending' | 'reviewed' | 'late'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function periodLabel(period: number | null, intervalDays: number | null) {
  const kind = intervalDays === 7 ? 'Tuần' : 'Đợt'
  return `Báo cáo ${kind} ${period ?? '-'}`
}

function isLateReport(report: ReportRow): boolean {
  return !!(
    report.submitted_at &&
    report.due_date &&
    new Date(report.submitted_at).getTime() > new Date(report.due_date).getTime()
  )
}

const ATT_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  present: { label: 'Đúng giờ', variant: 'success' },
  late: { label: 'Đi muộn', variant: 'warning' },
  absent: { label: 'Vắng mặt', variant: 'danger' },
  wfh: { label: 'WFH', variant: 'info' },
}

export function ReportCenter({
  userId,
  interns,
  reports,
  attendanceToday,
}: {
  userId: string
  interns: InternBrief[]
  reports: ReportRow[]
  attendanceToday: AttendanceRow[]
}) {
  const internIds = useMemo(() => interns.map((i) => i.id), [interns])
  const internIdsKey = [...internIds].sort().join(',')

  const todayKey = toDateKey(new Date())

  const [view, setView] = useState<ViewKey>('reports')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('pending')
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null)

  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [attendance, setAttendance] = useState<AttendanceRow[]>(attendanceToday)

  useEffect(() => {
    if (internIds.length === 0) return
    let active = true
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('attendance')
        .select('intern_id, check_in_time, check_out_time, total_hours, status')
        .eq('date', selectedDate)
        .in('intern_id', internIds)
        .order('check_in_time', { ascending: true })
      if (!active) return
      setAttendance(error || !data ? [] : (data as AttendanceRow[]))
    }
    void load()
    return () => {
      active = false
    }
  }, [selectedDate, internIdsKey, internIds])

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(start)
      day.setDate(start.getDate() + idx)
      return { key: toDateKey(day), day: day.getDate(), weekday: WEEKDAYS[idx], isToday: toDateKey(day) === todayKey }
    })
  }, [todayKey])

  const pendingReports = useMemo(() => reports.filter((r) => r.status === 'submitted'), [reports])
  const reviewedReports = useMemo(() => reports.filter((r) => r.status === 'reviewed'), [reports])
  const lateReports = useMemo(() => reports.filter((r) => r.status === 'submitted' && isLateReport(r)), [reports])

  const visibleReports = useMemo(() => {
    if (reportFilter === 'pending') return pendingReports
    if (reportFilter === 'reviewed') return reviewedReports
    return lateReports
  }, [reportFilter, pendingReports, reviewedReports, lateReports])

  const reportPills: { key: ReportFilter; label: string; count: number }[] = [
    { key: 'pending', label: 'Chờ duyệt', count: pendingReports.length },
    { key: 'reviewed', label: 'Đã duyệt', count: reviewedReports.length },
    { key: 'late', label: 'Nộp trễ', count: lateReports.length },
  ]

  const attByIntern = useMemo(() => new Map(attendance.map((a) => [a.intern_id, a])), [attendance])
  const checkedIn = attendance.filter((a) => a.check_in_time).length
  const onTime = attendance.filter((a) => a.status === 'present').length
  const lateOrAbsent = attendance.filter((a) => a.status === 'late' || a.status === 'absent').length
  const isFutureDate = selectedDate > todayKey

  return (
    <>
      <NotificationsRealtime userId={userId} internIds={internIds} />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 -mx-4 space-y-3 border-b border-border bg-background/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <p className="text-lg font-bold tracking-tight text-foreground">Báo cáo &amp; Chấm công</p>

        <div className="relative">
          <div className="grid h-11 grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setView('reports')}
              className={cn(
                'rounded-lg transition-colors',
                view === 'reports' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              Báo cáo tiến độ
            </button>
            <button
              type="button"
              onClick={() => setView('attendance')}
              className={cn(
                'rounded-lg transition-colors',
                view === 'attendance' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              Bảng chấm công
            </button>
          </div>
        </div>

        {view === 'reports' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {reportPills.map((pill) => {
              const isActive = reportFilter === pill.key
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setReportFilter(pill.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs transition-colors',
                    isActive
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'bg-muted text-muted-foreground active:bg-muted/80',
                  )}
                >
                  {pill.label}
                  <span
                    className={cn(
                      'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-border text-muted-foreground',
                    )}
                  >
                    {pill.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* View 1: Báo cáo tiến độ */}
      {view === 'reports' && (
        <div className="flex flex-col gap-3 pt-3">
          {visibleReports.length > 0 ? (
            visibleReports.map((report) => {
              const late = report.status === 'submitted' && isLateReport(report)
              return (
                <div
                  key={report.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedReport(report)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedReport(report)
                    }
                  }}
                  className="w-full cursor-pointer space-y-3 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        src={report.profiles?.avatar_url}
                        name={report.profiles?.full_name ?? '?'}
                        size={36}
                        className="rounded-full border border-border"
                      />
                      <p className="truncate text-sm font-medium">
                        {report.profiles?.full_name ?? 'Thực tập sinh'}
                      </p>
                    </div>
                    <Badge variant="primary" className="shrink-0 text-[10px]">
                      {periodLabel(report.period_number, report.report_interval_days)}
                    </Badge>
                  </div>

                  <p className="line-clamp-2 text-sm text-foreground">
                    {report.content || 'Không có nội dung mô tả.'}
                  </p>

                  <div className="flex items-center gap-2">
                    <Badge variant={late ? 'danger' : 'success'} className="text-[10px]">
                      {late ? 'Nộp trễ' : 'Nộp đúng hạn'}
                    </Badge>
                    {formatDate(report.due_date) && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        Hạn {formatDate(report.due_date)}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                    className="h-10 w-full rounded-xl font-medium"
                  >
                    Xem &amp; Phản hồi
                  </Button>
                </div>
              )
            })
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Không có báo cáo nào ở trạng thái này.
            </p>
          )}
        </div>
      )}

      {/* View 2: Bảng chấm công */}
      {view === 'attendance' && (
        <div className="pt-3">
          {/* Date strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {weekDays.map((day) => {
              const isSelected = selectedDate === day.key
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.key)
                    if (day.key !== todayKey) setAttendance([])
                  }}
                  className={cn(
                    'flex w-12 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-2 text-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground active:bg-muted',
                  )}
                >
                  <span className="text-[10px] font-medium">{day.weekday}</span>
                  <span className="text-sm font-semibold tabular-nums">{day.day}</span>
                  {day.isToday && (
                    <span
                      className={cn(
                        'text-[9px] font-medium',
                        isSelected ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    >
                      Hôm nay
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Attendance summary */}
          <div className="my-3 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-center text-xs font-medium">
            <div>
              <p className="text-base font-bold tabular-nums">
                {checkedIn}/{interns.length}
              </p>
              <p className="mt-0.5 text-muted-foreground">Đã Check-in</p>
            </div>
            <div>
              <p className="text-base font-bold tabular-nums text-success">{onTime}</p>
              <p className="mt-0.5 text-muted-foreground">Đúng giờ</p>
            </div>
            <div>
              <p className={cn('text-base font-bold tabular-nums', (lateOrAbsent ?? 0) > 0 && 'text-destructive')}>
                {lateOrAbsent}
              </p>
              <p className="mt-0.5 text-muted-foreground">Đi muộn/Vắng</p>
            </div>
          </div>

          {/* Per-intern attendance */}
          <div>
              {interns.map((intern) => {
                const row = attByIntern.get(intern.id)
                const badge = row ? ATT_BADGE[row.status] ?? ATT_BADGE.default : undefined
                const badgeConfig = badge ?? (isFutureDate ? { label: 'Chưa điểm danh', variant: 'default' as const } : { label: 'Vắng mặt', variant: 'danger' as const })
                return (
                  <div
                    key={intern.id}
                    className="mb-2.5 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={intern.avatar_url}
                        name={intern.full_name}
                        size={40}
                        className="rounded-full border border-border"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{intern.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {intern.department ?? 'Chưa phân khoa'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <p className="text-xs font-semibold tabular-nums">
                        {formatTime(row?.check_in_time)} - {formatTime(row?.check_out_time)}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" weight="bold" />
                        {row?.total_hours != null ? `${row.total_hours} giờ` : '-- giờ'}
                      </p>
                      <Badge variant={badgeConfig.variant} className="mt-0.5 text-[10px]">
                        {badgeConfig.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {interns.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  Chưa có sinh viên nào được phân công.
                </p>
              )}
            </div>
        </div>
      )}

      {/* Review Drawer */}
      <ReportReviewDrawer
        report={selectedReport}
        open={selectedReport !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedReport(null)
        }}
      />
    </>
  )
}