import type { HTMLAttributes } from 'react'
import type { IconWeight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function SectionCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-border bg-card shadow-card overflow-hidden', className)} {...props} />
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string; weight?: IconWeight }>
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-border px-4 py-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" weight="bold" />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}
