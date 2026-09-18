'use client'

import { useMemo, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/mentor-app/avatar'
import { CreateTaskDrawer, type InternOption } from '@/components/CreateTaskDrawer'
import { InternDetailDrawer, type InternRow } from '@/components/mentor-app/intern-detail-drawer'
import { internshipProgress } from '@/lib/format'
import { cn } from '@/lib/utils'

type Health = 'attention' | 'almost_done' | 'done' | 'active'
type FilterKey = 'all' | 'active' | 'attention' | 'almost_done'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang tiến triển' },
  { key: 'attention', label: 'Cần chú ý' },
  { key: 'almost_done', label: 'Sắp hoàn thành' },
]

const HEALTH_BADGE: Record<Health, { label: string; variant: 'danger' | 'success' | 'warning' | 'primary' }> = {
  attention: { label: 'Cần chú ý', variant: 'danger' },
  almost_done: { label: 'Sắp hoàn thành', variant: 'warning' },
  done: { label: 'Hoàn thành', variant: 'primary' },
  active: { label: 'Đang làm', variant: 'success' },
}

function internHealth(intern: InternRow, percent: number | null): Health {
  if (intern.internship_status === 'completed_internship') return 'done'
  if (intern.overdue_count > 0) return 'attention'
  if (percent !== null && percent >= 80) return 'almost_done'
  return 'active'
}

function reportSummary(intern: InternRow): string {
  const report = intern.reports[0]
  if (!report || report.status === 'draft') return 'Chưa nộp'
  const prefix = report.status === 'reviewed' ? 'Đã duyệt' : 'Đã nộp'
  return `${prefix} Tuần ${report.period_number ?? '-'}`
}

function toInternOption(intern: InternRow): InternOption {
  return {
    id: intern.id,
    full_name: intern.full_name,
    email: intern.email,
    avatar_url: intern.avatar_url,
  }
}

export function StudentDirectory({ interns }: { interns: InternRow[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [createId, setCreateId] = useState<string | null>(null)

  const withHealth = useMemo(
    () =>
      interns.map((intern) => {
        const progress = internshipProgress(intern.start_date, intern.end_date)
        return { intern, health: internHealth(intern, progress?.percent ?? null), progress }
      }),
    [interns],
  )

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    return withHealth.filter(({ intern, health }) => {
      if (filter === 'active' && health !== 'active' && health !== 'done') return false
      if (filter === 'attention' && health !== 'attention') return false
      if (filter === 'almost_done' && health !== 'almost_done') return false
      if (!q) return true
      return (
        intern.full_name.toLowerCase().includes(q) ||
        intern.email.toLowerCase().includes(q) ||
        (intern.university ?? '').toLowerCase().includes(q) ||
        (intern.major ?? '').toLowerCase().includes(q)
      )
    })
  }, [withHealth, filter, q])

  const activeIntern = interns.find((i) => i.id === detailId) ?? null
  const createIntern = interns.find((i) => i.id === createId) ?? null

  return (
    <>
      {/* Sticky Header + Search + Filter */}
      <div className="sticky top-0 z-40 -mx-4 space-y-3 border-b border-border bg-background/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold tracking-tight text-foreground">Danh sách Thực tập sinh</p>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {interns.length} Sinh viên
          </span>
        </div>

        <div className="relative">
          <MagnifyingGlass
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            weight="bold"
          />
          <Input
            placeholder="Tìm kiếm sinh viên..."
            aria-label="Tìm kiếm sinh viên"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl border-0 bg-muted/50 pl-10 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((item) => {
            const isActive = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-xs transition-colors',
                  isActive
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'bg-muted text-muted-foreground active:bg-muted/80',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3 pt-3">
          {filtered.map(({ intern, health, progress }) => {
            const badge = HEALTH_BADGE[health]
            return (
              <button
                key={intern.id}
                type="button"
                onClick={() => setDetailId(intern.id)}
                className="w-full rounded-2xl border border-border/80 bg-card p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.99]"
              >
                {/* Dòng 1 */}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={intern.avatar_url}
                    name={intern.full_name}
                    size={48}
                    className="rounded-full border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-foreground">{intern.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {intern.university}
                      {intern.major ? ` - ${intern.major}` : ''}
                    </p>
                  </div>
                  <Badge variant={badge.variant} className="shrink-0 text-[10px]">
                    {badge.label}
                  </Badge>
                </div>

                {/* Dòng 2: Thời gian thực tập */}
                {progress && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Thời gian thực tập</span>
                      <span className="tabular-nums">
                        {progress.elapsed}/{progress.total} ngày
                      </span>
                    </div>
                    <Progress value={progress.percent} className="h-2 rounded-full" />
                  </div>
                )}

                {/* Dòng 3: Task + Báo cáo */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-center text-xs">
                  <div>
                    <p className="font-semibold tabular-nums">
                      {intern.task_completed}/{intern.task_total}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">Task hoàn thành</p>
                  </div>
                  <div>
                    <p className="font-semibold">{reportSummary(intern)}</p>
                    <p className="mt-0.5 text-muted-foreground">Báo cáo tuần</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Không tìm thấy sinh viên nào.
        </p>
      )}

      {/* Chi tiết sinh viên */}
      <InternDetailDrawer
        intern={activeIntern}
        open={detailId !== null}
        onOpenChange={(o) => {
          if (!o) setDetailId(null)
        }}
        onCreateTask={(intern) => {
          setDetailId(null)
          setCreateId(intern.id)
        }}
      />

      {/* Giao task riêng */}
      <CreateTaskDrawer
        open={createId !== null}
        onOpenChange={(o) => {
          if (!o) setCreateId(null)
        }}
        interns={createIntern ? [toInternOption(createIntern)] : []}
        initialSelected={createIntern ? [createIntern.id] : undefined}
      />
    </>
  )
}