'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

const APP_ROUTES = ['/admin', '/mentor', '/intern']

function sanitizeNext(raw: string): string {
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return ''
  return APP_ROUTES.some((r) => raw === r || raw.startsWith(`${r}/`)) ? raw : ''
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(login, initialState)
  const next = sanitizeNext(searchParams.get('next') ?? '')

  return (
    <Card className="w-full border-border bg-card shadow-card-hover">
      <CardHeader className="space-y-1.5">
        <Image
          src="/dlu-logo.png"
          alt="Logo Đại học Đà Lạt"
          width={48}
          height={48}
          className="mb-3 size-12 rounded-lg object-contain"
        />
        <CardTitle className="text-xl font-semibold tracking-tight">Đăng nhập</CardTitle>
        <CardDescription>
          Dùng tài khoản nội bộ của trường để truy cập hệ thống Quản lý Thực tập
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="email">
            Email công việc
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ten.dangnhap@dlu.edu.vn"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium" htmlFor="password">
            Mật khẩu
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              required
            />
          </label>
          {state.error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button className="h-10 w-full" type="submit" disabled={pending}>
            {pending ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}