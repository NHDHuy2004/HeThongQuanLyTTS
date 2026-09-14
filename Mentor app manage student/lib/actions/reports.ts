'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const reviewReportSchema = z.object({
  report_id: z.string().uuid(),
  feedback: z.string().trim().min(3, 'Nhap phan hoi toi thieu 3 ky tu').max(2000, 'Phan hoi qua dai'),
})

export type ReviewReportInput = z.input<typeof reviewReportSchema>

/** Marks a submitted periodic report as reviewed with the mentor's feedback. */
export async function reviewPeriodicReport(input: ReviewReportInput): Promise<ActionResult> {
  const parsed = reviewReportSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Du lieu khong hop le.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Ban can dang nhap de thuc hien thao tac nay.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return fail('Khong tim thay ho so nguoi dung.')
  if (profile.role !== 'mentor' && profile.role !== 'admin') {
    return fail('Chi Mentor moi co quyen phan hoi bao cao.')
  }

  const { data: report } = await supabase
    .from('periodic_reports')
    .select('id, status, intern_id, profiles!periodic_reports_intern_id_fkey(mentor_id)')
    .eq('id', parsed.data.report_id)
    .maybeSingle()
  if (!report) return fail('Khong tim thay bao cao dinh ky.')

  const internProfile = report.profiles
  if (!internProfile) return fail('Khong tim thay thuc tap sinh gui bao cao.')
  if (profile.role === 'mentor' && internProfile.mentor_id !== user.id) {
    return fail('Ban chi phan hoi duoc bao cao cua thuc tap sinh minh phu trach.')
  }
  if (report.status !== 'submitted') {
    return fail('Bao cao nay khong con cho phan hoi.')
  }

  const { error } = await supabase
    .from('periodic_reports')
    .update({ status: 'reviewed', mentor_feedback: parsed.data.feedback })
    .eq('id', parsed.data.report_id)
  if (error) return fail('Khong the cap nhat bao cao. Vui long thu lai.')

  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  return OK
}