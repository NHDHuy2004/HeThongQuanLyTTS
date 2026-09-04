'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function checkIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để điểm danh.')
  const { error } = await supabase.from('attendance').upsert({ intern_id: user.id, date: new Date().toISOString().slice(0, 10), check_in_time: new Date().toISOString(), status: 'present' }, { onConflict: 'intern_id,date' })
  if (error) throw new Error('Không thể ghi nhận check-in.')
  revalidatePath('/dashboard/attendance')
}

export async function checkOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để điểm danh.')
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const { data: record } = await supabase.from('attendance').select('check_in_time').eq('intern_id', user.id).eq('date', date).single()
  if (!record?.check_in_time) throw new Error('Bạn cần check-in trước.')
  const totalHours = (now.getTime() - new Date(record.check_in_time).getTime()) / 3600000
  const { error } = await supabase.from('attendance').update({ check_out_time: now.toISOString(), total_hours: Math.max(0, Number(totalHours.toFixed(2))) }).eq('intern_id', user.id).eq('date', date)
  if (error) throw new Error('Không thể ghi nhận check-out.')
  revalidatePath('/dashboard/attendance')
}