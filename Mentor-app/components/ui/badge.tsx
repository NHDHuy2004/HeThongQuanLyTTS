import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        primary: 'bg-primary/12 text-primary dark:bg-primary/25 dark:text-primary',
        success: 'bg-success/14 text-success dark:bg-success/25 dark:text-success',
        warning: 'bg-warning/25 text-warning-foreground',
        danger: 'bg-destructive/12 text-destructive dark:bg-destructive/22 dark:text-destructive',
        info: 'bg-info/30 text-info-foreground dark:bg-info/20 dark:text-info-foreground',
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

const statusVariant = (status: string) => {
  const map: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    pending_acceptance: 'warning',
    in_progress: 'primary',
    under_review: 'info',
    completed: 'success',
    on_time: 'success',
    late: 'danger',
    present: 'success',
    submitted: 'info',
    reviewed: 'success',
    wfh: 'info',
    low: 'default',
    medium: 'warning',
    high: 'danger',
    midterm: 'primary',
    final: 'info',
  }
  return map[status] ?? 'default'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    pending_acceptance: 'Chờ xác nhận',
    in_progress: 'Đang thực hiện',
    under_review: 'Chờ duyệt',
    completed: 'Hoàn thành',
    on_time: 'Đúng hạn',
    late: 'Trễ hạn',
    present: 'Có mặt',
    submitted: 'Đã nộp',
    reviewed: 'Đã duyệt',
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
