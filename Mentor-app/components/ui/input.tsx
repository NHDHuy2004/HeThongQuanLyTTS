import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'border-input bg-background h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs outline-none',
        'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
