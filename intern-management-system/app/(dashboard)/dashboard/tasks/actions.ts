'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assignee_id: z.string().uuid(),
  deadline: z.string().optional(),
})

export async function createTask(formData: FormData) {
  const values = taskSchema.safeParse(Object.fromEntries(formData))
  if (!values.success) throw new Error('Thông tin công việc không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { error } = await supabase.from('tasks').insert({
    ...values.data,
    creator_id: user.id,
    description: values.data.description || null,
    deadline: values.data.deadline || null,
  })
  if (error) throw new Error('Không thể tạo công việc.')
  revalidatePath('/dashboard/tasks')
}

export async function updateTaskStatus(formData: FormData) {
  const taskId = z.string().uuid().parse(formData.get('task_id'))
  const status = z.enum(['todo', 'doing', 'done']).parse(formData.get('status'))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
  if (error) throw new Error('Không thể cập nhật trạng thái.')
  revalidatePath('/dashboard/tasks')
}