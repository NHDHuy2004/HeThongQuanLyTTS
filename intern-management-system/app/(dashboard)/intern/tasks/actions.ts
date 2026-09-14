'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { fromDateTimeLocal } from '@/lib/format'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assignee_id: z.string().uuid(),
  parent_task_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  deadline: z.string().optional(),
})

const taskUpdateSchema = taskSchema.extend({
  task_id: z.string().uuid(),
})

export async function createTask(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const values = taskSchema.safeParse(Object.fromEntries(formData))
  if (!values.success) return fail('Thông tin công việc không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'intern') {
    return fail('Thực tập sinh không có quyền tạo công việc.')
  }

  if (profile.role === 'mentor') {
    if (values.data.assignee_id === user.id) {
      return fail('Mentor không thể giao công việc cho chính mình. Hãy chọn thực tập sinh phụ trách.')
    }
    const { data: targetIntern } = await supabase
      .from('profiles')
      .select('id, mentor_id')
      .eq('id', values.data.assignee_id)
      .single()

    if (targetIntern?.mentor_id !== user.id) {
      return fail('Bạn chỉ có thể phân công công việc cho thực tập sinh do mình phụ trách.')
    }
  }

  if (values.data.parent_task_id) {
    const { data: parent } = await supabase
      .from('tasks')
      .select('id, parent_task_id')
      .eq('id', values.data.parent_task_id)
      .maybeSingle()

    if (!parent || parent.parent_task_id !== null) {
      return fail('Chỉ có thể gắn công việc con vào một công việc cha cấp cao nhất.')
    }
  }

  const { error } = await supabase.from('tasks').insert({
    title: values.data.title,
    description: values.data.description || null,
    category: values.data.category || null,
    priority: values.data.priority,
    assignee_id: values.data.assignee_id,
    parent_task_id: values.data.parent_task_id || null,
    creator_id: user.id,
    deadline: values.data.deadline ? fromDateTimeLocal(values.data.deadline) : null,
  })
  if (error) return fail('Không thể tạo công việc. Kiểm tra quyền phân công.')
  revalidateTasks()
  return OK
}

async function revalidateTasks() {
  revalidatePath('/admin/tasks')
  revalidatePath('/mentor/tasks')
  revalidatePath('/intern/tasks')
  revalidatePath('/intern')
}

/**
 * Edits a task. Interns are not allowed (they may only change status - enforced
 * both here and by the tasks_no_intern_edit DB trigger). Mentors may edit tasks
 * they created or tasks assigned to interns they mentor.
 */
export async function updateTask(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const values = taskUpdateSchema.safeParse(Object.fromEntries(formData))
  if (!values.success) return fail('Thông tin công việc không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role === 'intern') {
    return fail('Thực tập sinh chỉ được cập nhật trạng thái công việc.')
  }

  const { data: target } = await supabase
    .from('tasks')
    .select('id, assignee_id, creator_id')
    .eq('id', values.data.task_id)
    .maybeSingle()
  if (!target) return fail('Không tìm thấy công việc.')

  if (values.data.task_id === values.data.parent_task_id) {
    return fail('Công việc không thể là công việc cha của chính nó.')
  }

  if (profile.role === 'mentor') {
    const { data: assignee } = await supabase
      .from('profiles')
      .select('mentor_id')
      .eq('id', target.assignee_id)
      .maybeSingle()

    const isOwn = target.creator_id === user.id || assignee?.mentor_id === user.id
    if (!isOwn) {
      return fail('Bạn chỉ có thể chỉnh sửa công việc do mình tạo hoặc của thực tập sinh phụ trách.')
    }

    if (values.data.assignee_id === user.id) {
      return fail('Mentor không thể giao công việc cho chính mình. Hãy chọn thực tập sinh phụ trách.')
    }
    if (values.data.assignee_id !== target.assignee_id) {
      const { data: nextIntern } = await supabase
        .from('profiles')
        .select('id, mentor_id')
        .eq('id', values.data.assignee_id)
        .single()
      if (!nextIntern || nextIntern.mentor_id !== user.id) {
        return fail('Bạn chỉ có thể phân công công việc cho thực tập sinh do mình phụ trách.')
      }
    }
  }

  if (values.data.parent_task_id) {
    const { data: parent } = await supabase
      .from('tasks')
      .select('id, parent_task_id')
      .eq('id', values.data.parent_task_id)
      .maybeSingle()

    if (!parent || parent.parent_task_id !== null) {
      return fail('Chỉ có thể gắn công việc con vào một công việc cha cấp cao nhất.')
    }
  }

  const { error } = await supabase.from('tasks').update({
    title: values.data.title,
    description: values.data.description || null,
    category: values.data.category || null,
    priority: values.data.priority,
    assignee_id: values.data.assignee_id,
    parent_task_id: values.data.parent_task_id || null,
    deadline: values.data.deadline ? fromDateTimeLocal(values.data.deadline) : null,
  }).eq('id', values.data.task_id)
  if (error) return fail('Không thể chỉnh sửa công việc.')

  revalidateTasks()
  return OK
}

/**
 * Workflow-aware status transition.
 *
 * Intern (assignee):
 *   - pending_acceptance -> in_progress  (accept: records accepted_at)
 *   - in_progress -> under_review        (submit: records submitted_at + submission_url)
 *
 * Mentor/Admin (creator or mentor of assignee):
 *   - under_review -> completed          (approve: records completed_at; DB computes on_time/late)
 *   - under_review -> in_progress        (rework: requires feedback)
 *   - under_review -> rejected           (reject: requires feedback)
 *
 * The DB trigger prevent_intern_task_edit enforces the same transitions server-side.
 */
export async function updateTaskStatus(formData: FormData): Promise<ActionResult> {
  const taskId = z.string().uuid().safeParse(formData.get('task_id'))
  const status = z
    .enum(['pending_acceptance', 'in_progress', 'under_review', 'completed', 'rejected'])
    .safeParse(formData.get('status'))
  const feedback = z.string().trim().max(2000).safeParse(formData.get('feedback') ?? '')
  const submissionUrl = z.string().trim().max(500).safeParse(formData.get('submission_url') ?? '')

  if (!taskId.success || !status.success) return fail('Dữ liệu không hợp lệ.')
  if (!feedback.success) return fail('Nội dung phản hồi quá dài.')
  if (!submissionUrl.success) return fail('Liên kết kết quả không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const actorRole = profile?.role ?? null

  const { data: target } = await supabase
    .from('tasks')
    .select('id, assignee_id, creator_id, status')
    .eq('id', taskId.data)
    .maybeSingle()

  if (!target) return fail('Không tìm thấy công việc.')
  if (target.status === 'completed') return fail('Công việc đã hoàn thành, không thể đổi trạng thái.')
  if (target.status === 'rejected') return fail('Công việc đã bị từ chối.')

  const from = target.status
  const to = status.data

  if (actorRole === 'intern') {
    if (target.assignee_id !== user.id) {
      return fail('Bạn chỉ có thể cập nhật công việc được giao cho bạn.')
    }
    if (from === 'pending_acceptance' && to === 'in_progress') {
      const { error } = await supabase
        .from('tasks')
        .update({ status: to, accepted_at: new Date().toISOString() })
        .eq('id', taskId.data)
      if (error) return fail('Không thể xác nhận công việc.')
      revalidateTasks()
      return OK
    }
    if (from === 'in_progress' && to === 'under_review') {
      if (!submissionUrl.data) {
        return fail('Vui lòng nhập liên kết kết quả/bài làm trước khi nộp.')
      }
      const { error } = await supabase
        .from('tasks')
        .update({
          status: to,
          submitted_at: new Date().toISOString(),
          submission_url: submissionUrl.data,
        })
        .eq('id', taskId.data)
      if (error) return fail('Không thể nộp bài.')
      revalidateTasks()
      return OK
    }
    return fail('Luồng trạng thái không hợp lệ cho Thực tập sinh.')
  }

  if (actorRole === 'mentor' || actorRole === 'admin') {
    const { data: assignee } = await supabase
      .from('profiles')
      .select('mentor_id')
      .eq('id', target.assignee_id)
      .maybeSingle()

    const canReview = actorRole === 'admin' || target.creator_id === user.id || assignee?.mentor_id === user.id
    if (!canReview) {
      return fail('Bạn chỉ có thể duyệt công việc do mình tạo hoặc của thực tập sinh phụ trách.')
    }

    if (from === 'under_review' && to === 'completed') {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: to,
          completed_at: new Date().toISOString(),
          feedback: feedback.data || null,
        })
        .eq('id', taskId.data)
      if (error) return fail('Không thể duyệt công việc.')
      revalidateTasks()
      return OK
    }

    if (from === 'under_review' && to === 'in_progress') {
      if (!feedback.data) return fail('Vui lòng ghi phản hồi yêu cầu làm lại.')
      const { error } = await supabase
        .from('tasks')
        .update({
          status: to,
          feedback: feedback.data,
          submitted_at: null,
        })
        .eq('id', taskId.data)
      if (error) return fail('Không thể yêu cầu làm lại.')
      revalidateTasks()
      return OK
    }

    if (from === 'under_review' && to === 'rejected') {
      if (!feedback.data) return fail('Vui lòng ghi lý do từ chối.')
      const { error } = await supabase
        .from('tasks')
        .update({
          status: to,
          feedback: feedback.data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId.data)
      if (error) return fail('Không thể từ chối công việc.')
      revalidateTasks()
      return OK
    }

    return fail('Luồng trạng thái không hợp lệ. Chỉ có thể duyệt công việc đang chờ duyệt.')
  }

  return fail('Vai trò không hợp lệ.')
}