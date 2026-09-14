import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'border-input bg-background min-h-24 w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs outline-none',
        'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors resize-none',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
