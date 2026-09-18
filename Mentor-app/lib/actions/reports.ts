'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const reviewReportSchema = z.object({
  report_id: z.string().uuid(),
  feedback: z.string().trim().min(3, 'Nhập phản hồi tối thiểu 3 ký tự').max(2000, 'Phản hồi quá dài'),
})

export type ReviewReportInput = z.input<typeof reviewReportSchema>

/** Marks a submitted periodic report as reviewed with the mentor's feedback. */
export async function reviewPeriodicReport(input: ReviewReportInput): Promise<ActionResult> {
  const parsed = reviewReportSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Dữ liệu không hợp lệ.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail('Không tìm thấy hồ sơ người dùng.')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    return fail('Chỉ Mentor mới có quyền phản hồi báo cáo.')
  }

  const { data: report } = await supabase
    .from('periodic_reports')
    .select('id, status, intern_id, profiles!periodic_reports_intern_id_fkey(mentor_id)')
    .eq('id', parsed.data.report_id)
    .maybeSingle()
  if (!report) return fail('Không tìm thấy báo cáo định kỳ.')

  const internProfile = report.profiles
  if (!internProfile) return fail('Không tìm thấy thực tập sinh gửi báo cáo.')
  if (profile.role === 'mentor' && internProfile.mentor_id !== user.id) {
    return fail('Bạn chỉ phản hồi được báo cáo của thực tập sinh mình phụ trách.')
  }
  if (report.status !== 'submitted') {
    return fail('Báo cáo này không còn chờ phản hồi.')
  }

  const { error } = await supabase
    .from('periodic_reports')
    .update({ status: 'reviewed', mentor_feedback: parsed.data.feedback })
    .eq('id', parsed.data.report_id)
  if (error) return fail('Không thể cập nhật báo cáo. Vui lòng thử lại.')

  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  revalidatePath('/mentor-app/reports')
  return OK
}

/** Requests a rework by moving the submitted report back to draft with the mentor's feedback. */
export async function reworkPeriodicReport(input: ReviewReportInput): Promise<ActionResult> {
  const parsed = reviewReportSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Dữ liệu không hợp lệ.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail('Không tìm thấy hồ sơ người dùng.')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    return fail('Chỉ Mentor mới có quyền yêu cầu nộp lại báo cáo.')
  }

  const { data: report } = await supabase
    .from('periodic_reports')
    .select('id, status, intern_id, profiles!periodic_reports_intern_id_fkey(mentor_id)')
    .eq('id', parsed.data.report_id)
    .maybeSingle()
  if (!report) return fail('Không tìm thấy báo cáo định kỳ.')

  const internProfile = report.profiles
  if (!internProfile) return fail('Không tìm thấy thực tập sinh gửi báo cáo.')
  if (profile.role === 'mentor' && internProfile.mentor_id !== user.id) {
    return fail('Bạn chỉ phản hồi được báo cáo của thực tập sinh mình phụ trách.')
  }
  if (report.status !== 'submitted') {
    return fail('Báo cáo này không còn chờ phản hồi.')
  }

  const { error } = await supabase
    .from('periodic_reports')
    .update({ status: 'draft', mentor_feedback: parsed.data.feedback })
    .eq('id', parsed.data.report_id)
  if (error) return fail('Không thể yêu cầu nộp lại. Vui lòng thử lại.')

  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  revalidatePath('/mentor-app/reports')
  return OK
}