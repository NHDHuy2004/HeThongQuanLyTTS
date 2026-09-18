'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fromDateTimeLocal, fromDateOnly } from '@/lib/format'
import { type ActionResult, OK, fail } from '@/lib/action-utils'
import type { Database, TablesUpdate } from '@/lib/supabase/database.types'

type TaskPriority = Database['public']['Enums']['task_priority']

const createTasksSchema = z.object({
  title: z.string().trim().min(3, 'Tên công việc quá ngắn').max(200, 'Tên công việc quá dài'),
  description: z.string().trim().max(2000, 'Mô tả quá dài').optional().default(''),
  category: z.string().trim().max(100, 'Danh mục quá dài').optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  deadline: z.string().optional().default(''),
  assigneeIds: z.array(z.string().uuid()).min(1, 'Chọn ít nhất một thực tập sinh').max(20, 'Chỉ giao được tối đa 20 sinh viên'),
})

export type CreateTaskInput = z.input<typeof createTasksSchema>

/** Creates one task per selected intern. Mentors may only assign interns they mentor. */
export async function createTasks(input: CreateTaskInput): Promise<ActionResult> {
  const parsed = createTasksSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Dữ liệu không hợp lệ.')
  }
  const values = parsed.data

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
    return fail('Chỉ Mentor mới có quyền giao việc.')
  }

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, role, mentor_id')
    .in('id', values.assigneeIds)

  const internMap = new Map((interns ?? []).map((i) => [i.id, i]))

  for (const id of values.assigneeIds) {
    const intern = internMap.get(id)
    if (!intern || intern.role !== 'intern') {
      return fail('Có thực tập sinh không hợp lệ trong danh sách.')
    }
    if (profile.role === 'mentor' && intern.mentor_id !== user.id) {
      return fail('Bạn chỉ giao việc được cho thực tập sinh mình phụ trách.')
    }
  }

  const deadlineIso = values.deadline
    ? values.deadline.includes('T')
      ? fromDateTimeLocal(values.deadline)
      : fromDateOnly(values.deadline)
    : null

  const rows = values.assigneeIds.map((id) => ({
    title: values.title,
    description: values.description || null,
    category: values.category || null,
    priority: values.priority as TaskPriority,
    assignee_id: id,
    creator_id: user.id,
    deadline: deadlineIso,
    status: 'pending_acceptance' as const,
  }))

  const { error } = await supabase.from('tasks').insert(rows)
  if (error) {
    return fail('Không thể tạo công việc. Kiểm tra quyền phân công.')
  }

  revalidatePath('/mentor-app/tasks')
  revalidatePath('/mentor-app/home')
  return OK
}

const reviewTaskSchema = z
  .object({
    task_id: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
    feedback: z.string().trim().max(2000, 'Nhận xét quá dài').optional().default(''),
  })
  .refine(
    (data) => data.decision === 'approved' || data.feedback.trim().length >= 3,
    { message: 'Nhập nhận xét trước khi từ chối.' },
  )

export type ReviewTaskInput = z.input<typeof reviewTaskSchema>

/** Approves or rejects a submitted task. Feedback is required when rejecting. */
export async function reviewTaskSubmission(input: ReviewTaskInput): Promise<ActionResult> {
  const parsed = reviewTaskSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Dữ liệu không hợp lệ.')
  }
  const { task_id, decision, feedback } = parsed.data

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
    return fail('Chỉ Mentor mới có quyền duyệt bài nộp.')
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, status, deadline, assignee_id, profiles!tasks_assignee_id_fkey(mentor_id, role)')
    .eq('id', task_id)
    .maybeSingle()
  if (!task) return fail('Không tìm thấy công việc.')
  if (task.status !== 'under_review') return fail('Bài nộp này không còn chờ duyệt.')

  const assignee = task.profiles
  if (!assignee) return fail('Không tìm thấy thực tập sinh nộp bài.')
  if (profile.role === 'mentor' && assignee.mentor_id !== user.id) {
    return fail('Bạn chỉ duyệt được bài của thực tập sinh mình phụ trách.')
  }

  const updates: TablesUpdate<'tasks'> = { feedback: feedback || null }
  if (decision === 'approved') {
    const now = new Date()
    updates.status = 'completed'
    updates.completed_at = now.toISOString()
    updates.completion_status = task.deadline && new Date(task.deadline).getTime() < now.getTime() ? 'late' : 'on_time'
  } else {
    updates.status = 'rejected'
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', task_id)
  if (error) return fail('Không thể cập nhật bài nộp. Vui lòng thử lại.')

  revalidatePath('/mentor-app/tasks')
  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  return OK
}