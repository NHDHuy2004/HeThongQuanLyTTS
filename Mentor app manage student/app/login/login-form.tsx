'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-2xl font-bold text-primary">DLU</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Dang nhap Mentor App</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Su dung tai khoan he thong quan ly thuc tap
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}

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
              Mat khau
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Nhap mat khau"
              required
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full h-11" disabled={isPending}>
            {isPending ? 'Dang xu ly...' : 'Dang nhap'}
          </Button>
        </form>
      </div>
    </div>
  )
}
