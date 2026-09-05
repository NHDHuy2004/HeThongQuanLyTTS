import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_48%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.22),transparent_45%),radial-gradient(circle_at_center,rgba(5,150,105,0.12),transparent_60%)]" />
      <div className="relative z-10 w-full">
        <Suspense fallback={<div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-xl bg-white/20" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}