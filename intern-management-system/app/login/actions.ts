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
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Email chưa được xác nhận. Hãy xác nhận email trong Supabase Authentication hoặc tắt Confirm email khi thử nghiệm.' }
    }
    return { error: 'Email hoặc mật khẩu không chính xác. Nếu vừa đổi quyền trong Supabase, hãy đăng xuất và thử lại.' }
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
  await supabase.auth.signOut()
  redirect('/login')
}