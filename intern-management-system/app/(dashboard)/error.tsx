'use client'

import { useEffect } from 'react'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <WarningCircle className="size-6" weight="duotone" />
      </span>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Không thể tải trang</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Đang có sự cố khi tải dữ liệu. Hãy thử lại sau vài giây.
        </p>
      </div>
      <Button onClick={retry}>Thử lại</Button>
    </div>
  )
}