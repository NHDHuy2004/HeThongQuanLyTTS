import { createClient } from '@/lib/supabase/server'
import { checkIn, checkOut } from './actions'
import { Button } from '@/components/ui/button'

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

  const { data: currentProfile } = await supabase.from('profiles').select('id,full_name,email,role,mentor_id').eq('id', user.id).single()
  if (!currentProfile) return null
  const today = new Date().toISOString().slice(0, 10)

  if (currentProfile.role === 'intern') {
    const { data: record } = await supabase.from('attendance').select('check_in_time,check_out_time,total_hours,status').eq('intern_id', user.id).eq('date', today).maybeSingle()
    const canCheckIn = !record?.check_in_time
    const canCheckOut = Boolean(record?.check_in_time && !record?.check_out_time)
    return <div className="mx-auto max-w-4xl space-y-6"><Header date={today} /><section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Trạng thái hôm nay</p><p className="mt-1 text-xl font-semibold">{record?.check_out_time ? 'Đã hoàn tất' : record?.check_in_time ? 'Đang làm việc' : 'Chưa check-in'}</p>{record?.total_hours && <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tổng thời gian: {record.total_hours} giờ</p>}</div><div className="flex gap-2"><form action={checkIn}><Button type="submit" disabled={!canCheckIn}>Check-in</Button></form><form action={checkOut}><Button type="submit" variant="outline" disabled={!canCheckOut}>Check-out</Button></form></div></div></section></div>
  }

  const { data: visibleProfiles } = currentProfile.role === 'admin'
    ? await supabase.from('profiles').select('id,full_name,email,role,mentor_id').eq('role', 'intern').order('full_name')
    : await supabase.from('profiles').select('id,full_name,email,role,mentor_id').eq('mentor_id', user.id).eq('role', 'intern').order('full_name')
  const profiles = (visibleProfiles ?? []) as Profile[]
  const ids = profiles.map((profile) => profile.id)
  const { data: records } = ids.length ? await supabase.from('attendance').select('id,intern_id,date,check_in_time,check_out_time,total_hours,status').in('intern_id', ids).order('date', { ascending: false }).limit(100) : { data: [] as AttendanceRecord[] }
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]))

  return <div className="mx-auto max-w-6xl space-y-6"><Header date={today} subtitle="Theo dõi thời gian làm việc của Intern trong phạm vi quản lý." /><section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950"><span>Intern</span><span>Ngày</span><span>Check-in / out</span><span>Tổng giờ</span></div>{(records as AttendanceRecord[] | null)?.map((record) => <div key={record.id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-0 dark:border-slate-800"><span className="font-medium">{profileNames.get(record.intern_id) ?? 'Intern'}</span><span className="text-slate-500">{record.date}</span><span className="text-slate-500">{formatTime(record.check_in_time)} - {formatTime(record.check_out_time)}</span><span>{record.total_hours ? `${record.total_hours} giờ` : record.status}</span></div>)}{!records?.length && <p className="p-6 text-sm text-slate-500">Chưa có dữ liệu điểm danh.</p>}</section></div>
}

function Header({ date, subtitle = 'Ghi nhận thời gian làm việc trong ngày.' }: { date: string; subtitle?: string }) {
  return <div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{date}</p><h1 className="text-2xl font-semibold tracking-tight">Điểm danh</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}
