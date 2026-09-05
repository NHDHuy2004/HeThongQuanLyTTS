import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        primary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        warning: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        info: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

/** Map common status strings to badge variants */
const statusVariant = (status: string) => {
  const map: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    todo: 'default',
    doing: 'primary',
    done: 'success',
    present: 'success',
    late: 'warning',
    absent: 'danger',
    wfh: 'info',
    low: 'default',
    medium: 'warning',
    high: 'danger',
    midterm: 'primary',
    final: 'info',
  }
  return map[status] ?? 'default'
}

/** Map status strings to Vietnamese labels */
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    todo: 'Cần làm',
    doing: 'Đang làm',
    done: 'Hoàn tất',
    present: 'Có mặt',
    late: 'Đi trễ',
    absent: 'Vắng mặt',
    wfh: 'WFH',
    low: 'Thấp',
    medium: 'Vừa',
    high: 'Cao',
    midterm: 'Giữa kỳ',
    final: 'Cuối kỳ',
  }
  return map[status] ?? status
}

export { Badge, badgeVariants, statusVariant, statusLabel }
