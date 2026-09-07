'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assignee_id: z.string().uuid(),
  deadline: z.string().optional(),
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
    const { data: targetIntern } = await supabase
      .from('profiles')
      .select('id, mentor_id')
      .eq('id', values.data.assignee_id)
      .single()

    if (values.data.assignee_id !== user.id && targetIntern?.mentor_id !== user.id) {
      return fail('Bạn chỉ có thể phân công công việc cho thực tập sinh do mình phụ trách.')
    }
  }

  const { error } = await supabase.from('tasks').insert({
    ...values.data,
    creator_id: user.id,
    description: values.data.description || null,
    deadline: values.data.deadline || null,
  })
  if (error) return fail('Không thể tạo công việc. Kiểm tra quyền phân công.')
  revalidatePath('/intern/tasks')
  return OK
}

export async function updateTaskStatus(formData: FormData): Promise<void>
export async function updateTaskStatus(prev: ActionResult, formData: FormData): Promise<ActionResult>
export async function updateTaskStatus(
  arg1: ActionResult | FormData,
  arg2?: FormData
): Promise<ActionResult | void> {
  const formData = arg2 instanceof FormData ? arg2 : (arg1 as FormData)
  const taskId = z.string().uuid().safeParse(formData.get('task_id'))
  const status = z.enum(['todo', 'doing', 'done']).safeParse(formData.get('status'))
  if (!taskId.success || !status.success) return fail('Dữ liệu không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập.')

  const { error } = await supabase.from('tasks').update({ status: status.data }).eq('id', taskId.data)
  if (error) return fail('Không thể cập nhật trạng thái.')
  revalidatePath('/intern/tasks')
  return OK
}