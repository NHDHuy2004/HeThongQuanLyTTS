'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, null)

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-2xl font-bold text-primary">DLU</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Đăng ký tài khoản</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Tham gia hệ thống quản lý thực tập</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Họ và tên
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Họ và tên chính chủ"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@dalat.edu.vn"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              required
              autoComplete="new-password"
            />
          </div>

          {state?.success && (
            <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
              {state.success}
            </p>
          )}
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="h-11 w-full" disabled={isPending}>
            {isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-primary">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}