import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { formatTime, statusText, todayInVietnam } from '@/lib/format'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { EmptyState } from '@/components/page/empty-state'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { StatCard } from '@/components/page/stat-card'

type AttendanceRecord = {
  id: string
  intern_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  total_hours: number | null
  status: string
}

type Profile = { id: string; full_name: string; role: string; mentor_id: string | null }

export default async function AdminAttendancePage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'admin') redirect(`/${profile.role}`)

  const today = todayInVietnam()

  const { data: visibleProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, mentor_id')
    .eq('role', 'intern')
    .order('full_name')

  const profiles = (visibleProfiles ?? []) as Profile[]
  const ids = profiles.map((p) => p.id)

  const { data: records } = ids.length
    ? await supabase
        .from('attendance')
        .select('id, intern_id, date, check_in_time, check_out_time, total_hours, status')
        .in('intern_id', ids)
        .order('date', { ascending: false })
        .limit(100)
    : { data: [] as AttendanceRecord[] }

  const profileNames = new Map(profiles.map((p) => [p.id, p.full_name]))

  const checkedInTodayCount = (records as AttendanceRecord[])?.filter(
    (r) => r.date === today && r.check_in_time
  ).length ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Giám sát điểm danh toàn hệ thống"
        description="Theo dõi sĩ số có mặt và thời gian thực tập của tất cả sinh viên toàn trường."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số Thực tập sinh" value={profiles.length} icon={Users} tone="neutral" />
        <StatCard label="Đã Check-in hôm nay" value={checkedInTodayCount} icon={CalendarCheck} tone="success" />
        <StatCard label="Chưa điểm danh hôm nay" value={Math.max(0, profiles.length - checkedInTodayCount)} icon={WarningCircle} tone="warning" />
      </section>

      <SectionCard>
        <SectionHeader title="Danh sách bản ghi điểm danh" icon={CalendarBlank} />
        {records?.length ? (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr] gap-3 bg-muted px-5 py-3 text-xs font-semibold uppercase text-muted-foreground">
              <span>Thực tập sinh</span>
              <span>Ngày</span>
              <span>Check-in / Check-out</span>
              <span>Tổng giờ làm</span>
            </div>
            {(records as AttendanceRecord[]).map((record) => (
              <div key={record.id} className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr] gap-3 px-5 py-4 text-sm">
                <span className="font-medium">{profileNames.get(record.intern_id) ?? 'Thực tập sinh'}</span>
                <span className="text-muted-foreground tabular-nums">{record.date}</span>
                <span className="text-muted-foreground tabular-nums">{formatTime(record.check_in_time)} - {formatTime(record.check_out_time)}</span>
                <span className="font-semibold text-success tabular-nums">{record.total_hours ? `${record.total_hours} giờ` : statusText(record.status)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarBlank}
            title="Chưa có dữ liệu điểm danh"
            description="Các bản ghi chấm công của thực tập sinh sẽ xuất hiện ở đây."
          />
        )}
      </SectionCard>
    </div>
  )
}


