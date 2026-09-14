import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'border-input bg-background h-11 w-full rounded-lg border px-3 py-2.5 text-sm shadow-xs outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors appearance-none',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
