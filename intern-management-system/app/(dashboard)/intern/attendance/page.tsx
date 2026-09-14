import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { formatTime, todayInVietnam } from '@/lib/format'
import { AttendanceControls } from '@/components/interns/attendance-controls'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { EmptyState } from '@/components/page/empty-state'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { StatCard } from '@/components/page/stat-card'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'intern') redirect(`/${profile.role}`)

  const today = todayInVietnam()

  // Today's record
  const { data: record } = await supabase
    .from('attendance')
    .select('check_in_time, check_out_time, total_hours, status')
    .eq('intern_id', user.id)
    .eq('date', today)
    .maybeSingle()

  const canCheckIn = !record?.check_in_time
  const canCheckOut = Boolean(record?.check_in_time && !record?.check_out_time)

  // Current intern's attendance history
  const { data: myHistory } = await supabase
    .from('attendance')
    .select('id, date, check_in_time, check_out_time, total_hours, status')
    .eq('intern_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const totalHoursAllTime = myHistory?.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dịch vụ sinh viên"
        title="Điểm danh hằng ngày"
        description="Ghi nhận thời gian đến làm việc và theo dõi lịch sử chấm công cá nhân."
      />

      {/* Today Action Card */}
      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" weight="bold" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Trạng thái hôm nay ({today})
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {record?.check_out_time ? 'Đã hoàn tất ngày làm việc' : record?.check_in_time ? 'Đang làm việc' : 'Chưa check-in'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Giờ vào: <strong className="text-foreground tabular-nums">{formatTime(record?.check_in_time)}</strong></span>
              <span>Giờ ra: <strong className="text-foreground tabular-nums">{formatTime(record?.check_out_time)}</strong></span>
              {record?.total_hours && (
                <span className="font-semibold text-success tabular-nums">
                  Thời lượng: {record.total_hours} giờ
                </span>
              )}
            </div>
          </div>

          <AttendanceControls canCheckIn={canCheckIn} canCheckOut={canCheckOut} />
        </div>
      </section>

      {/* Summary mini stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Số buổi đã điểm danh" value={`${myHistory?.length ?? 0} ngày`} icon={CalendarCheck} tone="neutral" />
        <StatCard label="Tổng giờ tích lũy" value={`${totalHoursAllTime.toFixed(1)} giờ`} icon={Clock} tone="success" />
      </div>

      {/* History Table */}
      <SectionCard>
        <SectionHeader title="Lịch sử điểm danh của bạn (30 ngày gần nhất)" icon={CalendarBlank} />
        {myHistory?.length ? (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] gap-3 bg-muted px-5 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
              <span>Ngày</span>
              <span>Giờ vào - Giờ ra</span>
              <span>Tổng thời gian</span>
              <span>Trạng thái</span>
            </div>
            {myHistory.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] gap-3 px-5 py-3.5 text-sm">
                <span className="font-medium tabular-nums">{row.date}</span>
                <span className="text-muted-foreground tabular-nums">{formatTime(row.check_in_time)} - {formatTime(row.check_out_time)}</span>
                <span className="font-semibold text-success tabular-nums">{row.total_hours ? `${row.total_hours}h` : '--'}</span>
                <span>
                  <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarBlank}
            title="Chưa có dữ liệu điểm danh"
            description="Bạn chưa có bản ghi chấm công nào. Check-in vào mỗi ngày làm việc để theo dõi."
          />
        )}
      </SectionCard>
    </div>
  )
}


