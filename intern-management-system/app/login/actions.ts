'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  next: z.string().optional(),
})

export type LoginState = { error?: string }

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu đăng nhập không hợp lệ.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  })

  if (error) {
    const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : ''
    const errorMessage = error.message.toLowerCase()

    if (errorCode === 'email_not_confirmed' || errorMessage.includes('email not confirmed')) {
      return { error: 'Email chưa được xác nhận. Hãy xác nhận email trong Supabase Authentication hoặc tắt Confirm email khi thử nghiệm.' }
    }
    if (errorCode === 'over_request_rate_limit' || error.status === 429) {
      return { error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.' }
    }
    if (errorCode === 'invalid_credentials' || errorMessage.includes('invalid login credentials')) {
      return { error: 'Email hoặc mật khẩu không chính xác. Hãy kiểm tra lại thông tin hoặc đặt lại mật khẩu trong Supabase.' }
    }
    return { error: 'Không thể đăng nhập lúc này. Vui lòng thử lại sau.' }
  }

  let target = parsed.data.next?.startsWith('/') ? parsed.data.next : ''
  if (!target) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      target = `/${profile?.role ?? 'intern'}`
    } else {
      target = '/login'
    }
  }

  redirect(target)
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('Không thể đăng xuất. Vui lòng thử lại.')
  }
  redirect('/login')
}