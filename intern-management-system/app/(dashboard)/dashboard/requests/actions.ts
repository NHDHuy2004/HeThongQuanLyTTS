'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  type: z.enum(['leave', 'wfh']),
  reason: z.string().trim().min(1).max(2000),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  mentor_id: z.string().uuid(),
}).refine((data) => data.end_date >= data.start_date, { message: 'Ngày kết thúc phải từ ngày bắt đầu.' })

export async function createRequest(formData: FormData) {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Đơn không hợp lệ.')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để gửi đơn.')
  const { error } = await supabase.from('leave_requests').insert({
    ...parsed.data,
    intern_id: user.id,
    start_date: parsed.data.start_date.toISOString().slice(0, 10),
    end_date: parsed.data.end_date.toISOString().slice(0, 10),
  })
  if (error) throw new Error('Không thể gửi đơn.')
  revalidatePath('/dashboard/requests')
}

export async function reviewRequest(formData: FormData) {
  const id = z.string().uuid().parse(formData.get('request_id'))
  const status = z.enum(['approved', 'rejected']).parse(formData.get('status'))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để duyệt đơn.')
  const { error } = await supabase.from('leave_requests').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('Không thể cập nhật đơn.')
  revalidatePath('/dashboard/requests')
}