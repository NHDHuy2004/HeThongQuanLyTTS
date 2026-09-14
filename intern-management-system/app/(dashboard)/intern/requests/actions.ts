'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const requestSchema = z.object({
  type: z.enum(['leave', 'wfh']),
  reason: z.string().trim().min(1).max(2000),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  mentor_id: z.string().uuid(),
}).refine((data) => data.end_date >= data.start_date, { message: 'Ngày kết thúc phải từ ngày bắt đầu.' })

export async function createRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Đơn không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để gửi đơn.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, mentor_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'intern' || profile.mentor_id !== parsed.data.mentor_id) {
    return fail('Mentor duyệt đơn phải là Mentor đang được Admin phân công cho bạn.')
  }

  const { error } = await supabase.from('leave_requests').insert({
    intern_id: user.id,
    type: parsed.data.type,
    reason: parsed.data.reason,
    mentor_id: parsed.data.mentor_id,
    start_date: parsed.data.start_date.toISOString().slice(0, 10),
    end_date: parsed.data.end_date.toISOString().slice(0, 10),
  })
  if (error) return fail('Không thể gửi đơn. Vui lòng kiểm tra lại Mentor phụ trách.')

  revalidatePath('/intern/requests')
  revalidatePath('/intern')
  return OK
}

const reviewSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
})

export async function reviewRequest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse({
    request_id: formData.get('request_id'),
    status: formData.get('status'),
  })
  if (!parsed.success) return fail('Thông tin duyệt đơn không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để duyệt đơn.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || actor.role === 'intern') {
    return fail('Thực tập sinh không có quyền phê duyệt đơn.')
  }

  if (actor.role === 'mentor') {
    const { data: targetReq } = await supabase
      .from('leave_requests')
      .select('mentor_id')
      .eq('id', parsed.data.request_id)
      .single()
    if (!targetReq || targetReq.mentor_id !== user.id) {
      return fail('Bạn chỉ có thể phê duyệt đơn của thực tập sinh do mình hướng dẫn.')
    }
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: parsed.data.status, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.data.request_id)
  if (error) return fail('Không thể cập nhật đơn.')

  revalidatePath('/intern/requests')
  revalidatePath('/intern')
  return OK
}