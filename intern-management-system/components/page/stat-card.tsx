import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const tones = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/25 text-warning-foreground',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'primary',
}: {
  label: string
  value: string | number
  icon: Icon
  hint?: string
  tone?: keyof typeof tones
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-tight text-muted-foreground">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', tones[tone])}>
          <Icon className="size-4" weight="bold" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  )
}