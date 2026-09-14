import Link from 'next/link'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <WarningCircle className="size-6" weight="duotone" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tighter">Trang không tồn tại</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Địa chỉ bạn truy cập không có trong hệ thống Quản lý Thực tập.
        </p>
      </div>
      <Button variant="outline" render={<Link href="/login" />}>
        Về trang đăng nhập
      </Button>
    </main>
  )
}