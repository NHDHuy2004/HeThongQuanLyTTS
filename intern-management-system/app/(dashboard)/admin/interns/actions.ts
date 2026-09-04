'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const permissionSchema = z.object({
  profile_id: z.string().uuid(),
  role: z.enum(['admin', 'mentor', 'intern']),
  mentor_id: z.union([z.string().uuid(), z.literal('')]),
})

export async function updatePermission(formData: FormData) {
  const parsed = permissionSchema.safeParse({
    profile_id: formData.get('profile_id'),
    role: formData.get('role'),
    mentor_id: formData.get('mentor_id') ?? '',
  })
  if (!parsed.success) throw new Error('Thông tin phân quyền không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (actor?.role !== 'admin') throw new Error('Chỉ Admin mới được thay đổi phân quyền.')

  const mentorId = parsed.data.role === 'intern' ? parsed.data.mentor_id || null : null
  const { error } = await supabase.from('profiles').update({ role: parsed.data.role, mentor_id: mentorId }).eq('id', parsed.data.profile_id)
  if (error) throw new Error('Không thể cập nhật phân quyền.')

  revalidatePath('/admin/interns')
  revalidatePath('/dashboard')
}