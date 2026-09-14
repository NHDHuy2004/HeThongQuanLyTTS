'use client'

import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { getDocumentUrl } from '@/app/(dashboard)/intern/documents/actions'
import { Button } from '@/components/ui/button'

export function DocumentDownloadLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    const result = await getDocumentUrl(path)
    setLoading(false)
    if ('url' in result) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="gap-1.5"
      aria-label="Tải xuống"
    >
      <DownloadSimple className="size-3.5" weight="bold" />
      {loading ? 'Đang tải...' : 'Tải xuống'}
    </Button>
  )
}