import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'min-h-24 resize-y',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
