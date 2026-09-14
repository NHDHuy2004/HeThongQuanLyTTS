'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const reportSchema = z.object({
  report_id: z.string().uuid(),
  task_id: z.string().uuid().optional().or(z.literal('')),
  content: z.string().trim().min(1).max(10000),
  attachment_url: z.string().trim().max(500).optional(),
})

export async function submitPeriodicReport(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reportSchema.safeParse({
    report_id: formData.get('report_id'),
    task_id: formData.get('task_id') ?? '',
    content: formData.get('content') ?? '',
    attachment_url: formData.get('attachment_url') ?? '',
  })
  if (!parsed.success) return fail('Thông tin báo cáo không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: intern } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!intern || intern.role !== 'intern') {
    return fail('Chỉ Thực tập sinh mới được nộp báo cáo định kỳ.')
  }

  const { data: report } = await supabase
    .from('periodic_reports')
    .select('id, intern_id, status')
    .eq('id', parsed.data.report_id)
    .maybeSingle()
  if (!report || report.intern_id !== user.id) {
    return fail('Không tìm thấy đợt báo cáo của bạn.')
  }
  if (report.status === 'submitted' || report.status === 'reviewed') {
    return fail('Đợt báo cáo này đã được nộp trước đó.')
  }

  const { error } = await supabase
    .from('periodic_reports')
    .update({
      task_id: parsed.data.task_id || null,
      content: parsed.data.content,
      attachment_url: parsed.data.attachment_url || null,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    })
    .eq('id', report.id)
  if (error) return fail('Không thể nộp báo cáo định kỳ.')

  revalidatePaths()
  return OK
}

export async function reviewPeriodicReport(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const reportId = z.string().uuid().safeParse(formData.get('report_id'))
  const feedback = z.string().trim().min(1).max(3000).safeParse(formData.get('mentor_feedback') ?? '')

  if (!reportId.success) return fail('Không tìm thấy báo cáo.')
  if (!feedback.success) return fail('Nội dung nhận xét không hợp lệ hoặc quá dài.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: report } = await supabase
    .from('periodic_reports')
    .select('intern_id')
    .eq('id', reportId.data)
    .maybeSingle()
  if (!report) return fail('Không tìm thấy báo cáo.')

  const { data: intern } = await supabase
    .from('profiles')
    .select('mentor_id')
    .eq('id', report.intern_id)
    .maybeSingle()
  if (!intern || intern.mentor_id !== user.id) {
    return fail('Bạn chỉ có thể duyệt báo cáo của Thực tập sinh do mình phụ trách.')
  }

  const { error } = await supabase
    .from('periodic_reports')
    .update({ mentor_feedback: feedback.data, status: 'reviewed' })
    .eq('id', reportId.data)
  if (error) return fail('Không thể lưu nhận xét.')

  revalidatePaths()
  return OK
}

function revalidatePaths() {
  revalidatePath('/intern/reports')
  revalidatePath('/mentor/reports')
  revalidatePath('/intern')
  revalidatePath('/mentor')
}