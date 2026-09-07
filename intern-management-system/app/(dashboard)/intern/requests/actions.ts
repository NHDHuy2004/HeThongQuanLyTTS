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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, mentor_id')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'intern' || profile.mentor_id !== parsed.data.mentor_id) {
    throw new Error('Mentor duyệt đơn phải là Mentor đang được Admin phân công cho bạn.')
  }

  const { error } = await supabase.from('leave_requests').insert({
    ...parsed.data,
    intern_id: user.id,
    start_date: parsed.data.start_date.toISOString().slice(0, 10),
    end_date: parsed.data.end_date.toISOString().slice(0, 10),
  })
  if (error) throw new Error('Không thể gửi đơn. Vui lòng kiểm tra lại Mentor phụ trách.')
  revalidatePath('/intern/requests')
  revalidatePath('/intern')
}

export async function reviewRequest(formData: FormData) {
  const id = z.string().uuid().parse(formData.get('request_id'))
  const status = z.enum(['approved', 'rejected']).parse(formData.get('status'))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để duyệt đơn.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || actor.role === 'intern') {
    throw new Error('Thực tập sinh không có quyền phê duyệt đơn.')
  }

  if (actor.role === 'mentor') {
    const { data: targetReq } = await supabase.from('leave_requests').select('mentor_id').eq('id', id).single()
    if (targetReq?.mentor_id !== user.id) {
      throw new Error('Bạn chỉ có thể phê duyệt đơn của thực tập sinh do mình hướng dẫn.')
    }
  }

  const { error } = await supabase.from('leave_requests').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('Không thể cập nhật đơn.')
  revalidatePath('/intern/requests')
  revalidatePath('/intern')
}