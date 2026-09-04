import { createClient } from '@/lib/supabase/server'
import { checkIn, checkOut } from './actions'
import { Button } from '@/components/ui/button'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const today = new Date().toISOString().slice(0, 10)
  const { data: record } = await supabase.from('attendance').select('check_in_time,check_out_time,total_hours,status').eq('intern_id', user.id).eq('date', today).maybeSingle()
  const canCheckIn = !record?.check_in_time
  const canCheckOut = Boolean(record?.check_in_time && !record?.check_out_time)

  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-medium text-teal-600">{today}</p><h1 className="text-2xl font-semibold tracking-tight">Điểm danh</h1><p className="mt-1 text-sm text-slate-500">Ghi nhận thời gian làm việc trong ngày.</p></div><section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Trạng thái hôm nay</p><p className="mt-1 text-xl font-semibold">{record?.check_out_time ? 'Đã hoàn tất' : record?.check_in_time ? 'Đang làm việc' : 'Chưa check-in'}</p>{record?.total_hours && <p className="mt-1 text-sm text-teal-600">Tổng thời gian: {record.total_hours} giờ</p>}</div><div className="flex gap-2"><form action={checkIn}><Button type="submit" disabled={!canCheckIn}>Check-in</Button></form><form action={checkOut}><Button type="submit" variant="outline" disabled={!canCheckOut}>Check-out</Button></form></div></div></section></div>
}