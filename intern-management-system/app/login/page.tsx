import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Đăng nhập',
}

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-primary/20 bg-primary p-10 text-primary-foreground lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/dlu-logo.png"
              alt="Logo Đại học Đà Lạt"
              width={40}
              height={40}
              className="size-10 rounded-lg bg-primary-foreground object-contain"
            />
            <div>
              <p className="text-sm font-bold leading-tight">Đại học Đà Lạt</p>
              <p className="text-xs font-medium opacity-70">Đà Lạt, Lâm Đồng</p>
            </div>
          </div>
          <h1 className="mt-12 max-w-md text-3xl font-semibold leading-none tracking-tighter">
            Quản lý thực tập.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">
            Hệ thống điều phối công việc, điểm danh, nghỉ phép và đánh giá cho thực tập sinh của trung tâm Công nghệ Thông tin.
          </p>
        </div>
        <p className="text-xs font-medium opacity-70">
          Hệ thống nội bộ, chỉ dành cho thành viên
        </p>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="flex h-96 animate-pulse items-center justify-center rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  )
}