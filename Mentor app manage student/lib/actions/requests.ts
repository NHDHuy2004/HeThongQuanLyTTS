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
  if (!parsed.success) return fail('Thong tin duyet don khong hop le.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Ban can dang nhap de duyet don.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail('Khong tim thay ho so nguoi dung.')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    return fail('Chi Mentor moi co quyen duyet don.')
  }

  const { data: target } = await supabase
    .from('leave_requests')
    .select('id, mentor_id, status')
    .eq('id', parsed.data.request_id)
    .maybeSingle()
  if (!target) return fail('Khong tim thay don xin nghi.')
  if (profile.role === 'mentor' && target.mentor_id !== user.id) {
    return fail('Ban chi duyet duoc don cua thuc tap sinh minh phu trach.')
  }
  if (target.status !== 'pending') {
    return fail('Don nay da duoc xu ly truoc do.')
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: parsed.data.decision, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.data.request_id)
  if (error) return fail('Khong the cap nhat don. Vui long thu lai.')

  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  return OK
}