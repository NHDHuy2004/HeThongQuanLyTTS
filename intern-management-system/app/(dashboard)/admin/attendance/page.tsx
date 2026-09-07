import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export default async function AdminAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect(`/${currentProfile?.role ?? 'login'}`)

  const today = new Date().toISOString().slice(0, 10)

  const { data: visibleProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, mentor_id')
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Giám sát điểm danh toàn hệ thống</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi sĩ số có mặt và thời gian thực tập của tất cả sinh viên toàn trường.
        </p>
      </div>

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
          <p className="p-6 text-sm text-slate-400 text-center">Chưa có dữ liệu điểm danh.</p>
        )}
      </section>
    </div>
  )
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}
