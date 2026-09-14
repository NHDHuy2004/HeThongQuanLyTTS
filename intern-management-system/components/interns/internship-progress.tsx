import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { Flag } from '@phosphor-icons/react/dist/ssr/Flag'
import { internshipProgress } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface InternshipProgressProps {
  startDate: string | null
  endDate: string | null
}

export function InternshipProgress({ startDate, endDate }: InternshipProgressProps) {
  const progress = internshipProgress(startDate, endDate)
  if (!startDate || !endDate || !progress) return null

  const { elapsed, total, percent } = progress
  const remaining = total - elapsed

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarBlank className="size-4 text-primary" weight="bold" />
          Đã thực tập
          <span className="tabular-nums font-medium text-foreground">
            {elapsed}/{total}
          </span>
          ngày
        </span>
        {remaining <= 0 ? (
          <Badge variant="success">
            <Flag className="size-3" weight="fill" />
            Đã hoàn thành chương trình
          </Badge>
        ) : (
          <span className="tabular-nums text-xs text-muted-foreground">Còn {remaining} ngày</span>
        )}
      </div>
      <Progress value={percent} />
    </div>
  )
}