'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fromDateTimeLocal, fromDateOnly } from '@/lib/format'
import { type ActionResult, OK, fail } from '@/lib/action-utils'
import type { Database, TablesUpdate } from '@/lib/supabase/database.types'

type TaskPriority = Database['public']['Enums']['task_priority']

const createTasksSchema = z.object({
  title: z.string().trim().min(3, 'Ten cong viec qua ngan').max(200, 'Ten cong viec qua dai'),
  description: z.string().trim().max(2000, 'Mo ta qua dai').optional().default(''),
  category: z.string().trim().max(100, 'Danh muc qua dai').optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  deadline: z.string().optional().default(''),
  assigneeIds: z.array(z.string().uuid()).min(1, 'Chon it nhat mot thuc tap sinh').max(20, 'Chi giao duoc toi da 20 sinh vien'),
})

export type CreateTaskInput = z.input<typeof createTasksSchema>

/** Creates one task per selected intern. Mentors may only assign interns they mentor. */
export async function createTasks(input: CreateTaskInput): Promise<ActionResult> {
  const parsed = createTasksSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Du lieu khong hop le.')
  }
  const values = parsed.data

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
    return fail('Chi Mentor moi co quyen giao viec.')
  }

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, role, mentor_id')
    .in('id', values.assigneeIds)

  const internMap = new Map((interns ?? []).map((i) => [i.id, i]))

  for (const id of values.assigneeIds) {
    const intern = internMap.get(id)
    if (!intern || intern.role !== 'intern') {
      return fail('Co thuc tap sinh khong hop le trong danh sach.')
    }
    if (profile.role === 'mentor' && intern.mentor_id !== user.id) {
      return fail('Ban chi giao viec duoc cho thuc tap sinh minh phu trach.')
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
    return fail('Khong the tao cong viec. Kiem tra quyen phan cong.')
  }

  revalidatePath('/mentor-app/tasks')
  revalidatePath('/mentor-app/home')
  return OK
}

const reviewTaskSchema = z
  .object({
    task_id: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
    feedback: z.string().trim().max(2000, 'Nhan xet qua dai').optional().default(''),
  })
  .refine(
    (data) => data.decision === 'approved' || data.feedback.trim().length >= 3,
    { message: 'Nhap nhan xet truoc khi tu choi.' },
  )

export type ReviewTaskInput = z.input<typeof reviewTaskSchema>

/** Approves or rejects a submitted task. Feedback is required when rejecting. */
export async function reviewTaskSubmission(input: ReviewTaskInput): Promise<ActionResult> {
  const parsed = reviewTaskSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Du lieu khong hop le.')
  }
  const { task_id, decision, feedback } = parsed.data

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
    return fail('Chi Mentor moi co quyen duyet bai nop.')
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, status, deadline, assignee_id, profiles!tasks_assignee_id_fkey(mentor_id, role)')
    .eq('id', task_id)
    .maybeSingle()
  if (!task) return fail('Khong tim thay cong viec.')
  if (task.status !== 'under_review') return fail('Bai nop nay khong con cho duyet.')

  const assignee = task.profiles
  if (!assignee) return fail('Khong tim thay thuc tap sinh nop bai.')
  if (profile.role === 'mentor' && assignee.mentor_id !== user.id) {
    return fail('Ban chi duyet duoc bai cua thuc tap sinh minh phu trach.')
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
  if (error) return fail('Khong the cap nhat bai nop. Vui long thu lai.')

  revalidatePath('/mentor-app/tasks')
  revalidatePath('/mentor-app/notifications')
  revalidatePath('/mentor-app/home')
  return OK
}