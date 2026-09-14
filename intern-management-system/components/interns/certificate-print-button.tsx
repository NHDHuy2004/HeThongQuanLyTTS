'use client'

import { Printer } from '@phosphor-icons/react/dist/ssr/Printer'
import { Button } from '@/components/ui/button'

export function CertificatePrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-1.5 print:hidden">
      <Printer className="size-4" weight="bold" />
      In / Xuất PDF
    </Button>
  )
}