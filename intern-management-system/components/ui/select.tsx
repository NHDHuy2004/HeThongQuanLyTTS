import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Select }
