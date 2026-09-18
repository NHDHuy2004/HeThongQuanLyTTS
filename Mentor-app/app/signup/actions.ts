'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const signUpSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Họ và tên tối thiểu 2 ký tự')
    .max(100, 'Họ và tên quá dài')
    .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Họ và tên không được chứa ký tự đặc biệt'),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(72, 'Mật khẩu quá dài'),
})

export type SignUpState = { error?: string; success?: string } | null

export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const { full_name, email, password } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  })

  if (error) {
    if (/already|exists/i.test(error.message)) {
      return { error: 'Email này đã được đăng ký. Bạn hãy đăng nhập.' }
    }
    return { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' }
  }

  return {
    success: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản rồi đăng nhập.',
  }
}