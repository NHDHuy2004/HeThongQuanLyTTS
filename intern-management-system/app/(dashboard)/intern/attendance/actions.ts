'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayInVietnam } from '@/lib/format'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

async function assertIntern(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<ActionResult | null> {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (profile && profile.role !== 'intern' && profile.role !== 'admin') {
    return fail('Chức năng điểm danh chỉ áp dụng cho Thực tập sinh.')
  }
  return null
}

export async function checkIn(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để điểm danh.')

  const blocked = await assertIntern(supabase, user.id)
  if (blocked) return blocked

  const date = todayInVietnam()
  const { data: existing } = await supabase
    .from('attendance')
    .select('id, check_in_time')
    .eq('intern_id', user.id)
    .eq('date', date)
    .maybeSingle()
  if (existing?.check_in_time) {
    return fail('Bạn đã check-in hôm nay rồi.')
  }

  const { error } = await supabase.from('attendance').upsert(
    { intern_id: user.id, date, check_in_time: new Date().toISOString(), status: 'present' },
    { onConflict: 'intern_id,date' }
  )
  if (error) return fail('Không thể ghi nhận check-in.')

  revalidatePath('/intern/attendance')
  revalidatePath('/intern')
  return OK
}

export async function checkOut(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để điểm danh.')

  const blocked = await assertIntern(supabase, user.id)
  if (blocked) return blocked

  const now = new Date()
  const date = todayInVietnam()
  const { data: record } = await supabase
    .from('attendance')
    .select('check_in_time, check_out_time')
    .eq('intern_id', user.id)
    .eq('date', date)
    .maybeSingle()
  if (!record?.check_in_time) return fail('Bạn cần check-in trước.')
  if (record.check_out_time) return fail('Bạn đã check-out hôm nay rồi.')

  const totalHours = (now.getTime() - new Date(record.check_in_time).getTime()) / 3600000
  const { error } = await supabase
    .from('attendance')
    .update({ check_out_time: now.toISOString(), total_hours: Math.max(0, Number(totalHours.toFixed(2))) })
    .eq('intern_id', user.id)
    .eq('date', date)
  if (error) return fail('Không thể ghi nhận check-out.')

  revalidatePath('/intern/attendance')
  revalidatePath('/intern')
  return OK
}