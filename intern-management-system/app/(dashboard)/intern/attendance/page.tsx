import { createClient } from '@/lib/supabase/server'
import { checkIn, checkOut } from './actions'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock3, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react'

type AttendanceRecord = {
  id: string
  intern_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  total_hours: number | null
  status: string
}

type Profile = { id: string; full_name: string; email: string; role: string; mentor_id: string | null }

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, mentor_id')
    .eq('id', user.id)
    .single()
  if (!currentProfile) return null

  const today = new Date().toISOString().slice(0, 10)
  const isIntern = currentProfile.role === 'intern'
  const isMentor = currentProfile.role === 'mentor'
  const isAdmin = currentProfile.role === 'admin'

  // ==========================================
  // 1. INTERN VIEW
  // ==========================================
  if (isIntern) {
    // Today's record
    const { data: record } = await supabase
      .from('attendance')
      .select('check_in_time, check_out_time, total_hours, status')
      .eq('intern_id', user.id)
      .eq('date', today)
      .maybeSingle()

    const canCheckIn = !record?.check_in_time
    const canCheckOut = Boolean(record?.check_in_time && !record?.check_out_time)

    // Historical records of this intern
    const { data: myHistory } = await supabase
      .from('attendance')
      .select('id, date, check_in_time, check_out_time, total_hours, status')
      .eq('intern_id', user.id)
      .order('date', { ascending: false })
      .limit(30)

    const totalHoursAllTime = myHistory?.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) ?? 0

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Header
          date={today}
          title="Điểm danh hằng ngày"
          subtitle="Ghi nhận thời gian đến làm việc và theo dõi lịch sử chấm công cá nhân."
        />

        {/* Today Action Card */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-6 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Trạng thái hôm nay ({today})
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {record?.check_out_time ? 'Đã hoàn tất ngày làm việc' : record?.check_in_time ? 'Đang làm việc' : 'Chưa check-in'}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span>Giờ vào: <strong>{formatTime(record?.check_in_time)}</strong></span>
                <span>Giờ ra: <strong>{formatTime(record?.check_out_time)}</strong></span>
                {record?.total_hours && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Thời lượng: {record.total_hours} giờ
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <form action={checkIn}>
                <Button type="submit" disabled={!canCheckIn} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  Check-in ngay
                </Button>
              </form>
              <form action={checkOut}>
                <Button type="submit" variant="outline" disabled={!canCheckOut} className="border-emerald-600 text-emerald-800 dark:text-emerald-300">
                  Check-out
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Summary mini stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Số buổi đã điểm danh</p>
              <p className="text-2xl font-bold mt-1">{myHistory?.length ?? 0} ngày</p>
            </div>
            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CalendarCheck className="size-5" />
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Tổng giờ tích lũy</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{totalHoursAllTime.toFixed(1)} giờ</p>
            </div>
            <span className="p-2.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Clock3 className="size-5" />
            </span>
          </div>
        </div>

        {/* History Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-sm font-semibold">Lịch sử điểm danh của bạn (30 ngày gần nhất)</h2>
          </div>
          <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-2.5 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <span>Ngày</span>
            <span>Giờ vào - Giờ ra</span>
            <span>Tổng thời gian</span>
            <span>Trạng thái</span>
          </div>
          {myHistory?.map((row) => (
            <div key={row.id} className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr] gap-3 border-b border-slate-100 px-5 py-3.5 text-sm last:border-0 dark:border-slate-800">
              <span className="font-medium text-slate-900 dark:text-slate-100">{row.date}</span>
              <span className="text-slate-500">{formatTime(row.check_in_time)} → {formatTime(row.check_out_time)}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{row.total_hours ? `${row.total_hours}h` : '--'}</span>
              <span className="capitalize text-slate-600 dark:text-slate-300">{row.status}</span>
            </div>
          ))}
          {!myHistory?.length && (
            <p className="p-6 text-sm text-slate-400 text-center">Chưa có dữ liệu điểm danh.</p>
          )}
        </section>
      </div>
    )
  }

  // ==========================================
  // 2. MENTOR & ADMIN VIEW
  // ==========================================
  const { data: visibleProfiles } = isAdmin
    ? await supabase.from('profiles').select('id, full_name, email, role, mentor_id').eq('role', 'intern').order('full_name')
    : await supabase.from('profiles').select('id, full_name, email, role, mentor_id').eq('mentor_id', user.id).eq('role', 'intern').order('full_name')

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

  // Today presence stats
  const checkedInTodayCount = (records as AttendanceRecord[])?.filter(
    (r) => r.date === today && r.check_in_time
  ).length ?? 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header
        date={today}
        title={isAdmin ? 'Giám sát điểm danh toàn hệ thống' : 'Theo dõi điểm danh Thực tập sinh phụ trách'}
        subtitle={isAdmin ? 'Theo dõi sĩ số và thời gian làm việc của tất cả thực tập sinh.' : 'Quản lý giờ làm và điểm danh của nhóm sinh viên bạn hướng dẫn.'}
      />

      {/* Overview Card */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Tổng số Thực tập sinh</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{profiles.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Đã Check-in hôm nay</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{checkedInTodayCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Chưa điểm danh hôm nay</p>
          <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{Math.max(0, profiles.length - checkedInTodayCount)}</p>
        </div>
      </section>

      {/* Records Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold">Danh sách bản ghi điểm danh</h2>
        </div>
        <div className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr] gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <span>Thực tập sinh</span>
          <span>Ngày</span>
          <span>Check-in / Check-out</span>
          <span>Tổng giờ làm</span>
        </div>
        {(records as AttendanceRecord[] | null)?.map((record) => (
          <div key={record.id} className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0 dark:border-slate-800">
            <span className="font-medium text-slate-900 dark:text-slate-100">{profileNames.get(record.intern_id) ?? 'Thực tập sinh'}</span>
            <span className="text-slate-500">{record.date}</span>
            <span className="text-slate-500">{formatTime(record.check_in_time)} → {formatTime(record.check_out_time)}</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{record.total_hours ? `${record.total_hours} giờ` : record.status}</span>
          </div>
        ))}
        {!records?.length && (
          <p className="p-6 text-sm text-slate-400 text-center">Chưa có dữ liệu điểm danh trong nhóm quản lý.</p>
        )}
      </section>
    </div>
  )
}

function Header({ date, title, subtitle }: { date: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-emerald-700 capitalize dark:text-emerald-400">{date}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}
