import Link from 'next/link'
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye'
import { Avatar } from '@/components/mentor-app/avatar'
import { ApproveButton } from '@/components/mentor-app/approve-button'
import { Badge, statusLabel, statusVariant } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ReviewTask {
  id: string
  title: string
  category: string | null
  submitted_at: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export function TaskReviewCard({ task }: { task: ReviewTask }) {
  const intern = task.profiles

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform duration-150 active:scale-[0.99]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar src={intern?.avatar_url} name={intern?.full_name ?? 'N/A'} size={36} />
          <p className="truncate text-sm font-medium">
            {intern?.full_name ?? 'Thực tập sinh'}
          </p>
        </div>
        <Badge variant={statusVariant('under_review')} className="shrink-0">
          {statusLabel('under_review')}
        </Badge>
      </div>

      <p className="mt-2 line-clamp-1 text-sm font-semibold">{task.title}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {task.category && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {task.category}
          </span>
        )}
        <span className="truncate text-[11px] text-muted-foreground">
          Nộp {formatRelativeTime(task.submitted_at ?? '')}
        </span>
      </div>

      <div className="mt-3 flex gap-2 border-t border-border/40 pt-3">
        <Link
          href="/mentor-app/tasks"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 rounded-xl')}
        >
          <Eye className="size-3.5" weight="bold" />
          Xem bài nộp
        </Link>
        <ApproveButton taskId={task.id} />
      </div>
    </div>
  )
}