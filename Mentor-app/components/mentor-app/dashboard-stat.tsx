import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const tones = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/25 text-warning-foreground',
  danger: 'bg-destructive/10 text-destructive',
} as const

export function DashboardStat({
  label,
  value,
  icon: Icon,
  tone = 'primary',
}: {
  label: string
  value: string | number
  icon: Icon
  tone?: keyof typeof tones
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm">
      <span className={cn('flex size-8 items-center justify-center rounded-lg', tones[tone])}>
        <Icon className="size-4" weight="bold" />
      </span>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}