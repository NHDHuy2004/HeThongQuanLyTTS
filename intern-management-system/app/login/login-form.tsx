'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export function LoginForm() {
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(login, initialState)
  const next = searchParams.get('next') ?? ''

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <CardHeader className="space-y-2">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-sky-500 text-lg font-bold text-white">IT</div>
        <CardTitle>Đăng nhập hệ thống</CardTitle>
        <CardDescription>Truy cập không gian quản lý thực tập sinh của trung tâm CNTT.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="next" value={next} />
          <label className="block space-y-2 text-sm font-medium" htmlFor="email">
            Email công việc
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="password">
            Mật khẩu
            <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
          </label>
          {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          <Button className="h-10 w-full" type="submit" disabled={pending}>
            {pending ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}