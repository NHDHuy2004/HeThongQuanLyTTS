import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: Icon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" weight="duotone" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}