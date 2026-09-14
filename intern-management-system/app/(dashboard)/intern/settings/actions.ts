'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  university: z.string().trim().max(200).optional(),
  major: z.string().trim().max(120).optional(),
  avatar_url: z.union([z.literal(''), z.string().url()]).optional(),
})

export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail('Thông tin hồ sơ không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập.')

  const { error } = await supabase.from('profiles').update({
    full_name: parsed.data.full_name,
    university: parsed.data.university || null,
    major: parsed.data.major || null,
    avatar_url: parsed.data.avatar_url || null,
  }).eq('id', user.id)
  if (error) return fail('Không thể cập nhật hồ sơ.')

  revalidatePath('/intern/settings')
  revalidatePath('/intern')
  return OK
}