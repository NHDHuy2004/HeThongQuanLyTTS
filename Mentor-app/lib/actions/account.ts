'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Họ tên quá dài'),
})

const changePasswordSchema = z.object({
  new_password: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự').max(72, 'Mật khẩu quá dài'),
})

export type UpdateProfileInput = z.input<typeof updateProfileSchema>
export type ChangePasswordInput = z.input<typeof changePasswordSchema>

/** Updates the logged-in user's display name. */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input)
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

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name })
    .eq('id', user.id)
  if (error) return fail('Không thể cập nhật hồ sơ. Vui lòng thử lại.')

  revalidatePath('/mentor-app/profile')
  return OK
}

/** Changes the logged-in user's password via Supabase Auth. */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Dữ liệu không hợp lệ.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password })
  if (error) return fail('Không thể đổi mật khẩu. Vui lòng thử lại.')

  return OK
}