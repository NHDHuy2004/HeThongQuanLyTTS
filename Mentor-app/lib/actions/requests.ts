'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const reviewSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
})

export type ReviewLeaveRequestInput = z.input<typeof reviewSchema>

/** Approves or rejects a leave/WFH request. Mentors may only review their own interns' requests. */
export async function reviewLeaveRequest(input: ReviewLeaveRequestInput): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return fail('Thông tin duyệt đơn không hợp lệ.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để duyệt đơn.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail('Không tìm thấy hồ sơ người dùng.')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    return fail('Chỉ Mentor mới có quyền duyệt đơn.')
  }

  const { data: target } = await supabase
    .from('leave_requests')
    .select('id, mentor_id, status')
    .eq('id', parsed.data.request_id)
    .maybeSingle()
  if (!target) return fail('Không tìm thấy đơn xin nghỉ.')
  if (profile.role === 'mentor' && target.mentor_id !== user.id) {
    return fail('Bạn chỉ duyệt được đơn của thực tập sinh mình phụ trách.')
  }
  if (target.status !== 'pending') {
    return fail('Đơn này đã được xử lý trước đó.')
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: parsed.data.decision, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.data.request_id)
  if (error) return fail('Không thể cập nhật đơn. Vui lòng thử lại.')

  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  return OK
}