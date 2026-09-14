'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html lang="vi">
      <body className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Hệ thống đang sự cố</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Một lỗi không mong muốn đã xảy ra. Bạn có thể thử lại hoặc liên hệ quản trị viên.
            </p>
          </div>
          <Button onClick={retry}>Thử lại</Button>
        </div>
      </body>
    </html>
  )
}