'use client'

import { useMemo, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Avatar } from './avatar'
import { StudentDetailSheet, type InternSummary } from './student-detail-sheet'
import { internshipProgress } from '@/lib/format'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | 'active' | 'completed'

function statusLabel(status: FilterStatus) {
  switch (status) {
    case 'active':
      return 'Dang thuc tap'
    case 'completed':
      return 'Da hoan thanh'
    default:
      return 'Tat ca'
  }
}

export function StudentList({ interns }: { interns: InternSummary[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [activeId, setActiveId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const activeCount = interns.filter((i) => i.internship_status === 'active').length
    const completedCount = interns.filter(
      (i) => i.internship_status === 'completed_internship',
    ).length
    return { all: interns.length, active: activeCount, completed: completedCount }
  }, [interns])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    let result = interns
    if (filter !== 'all') {
      const targetStatus = filter === 'active' ? 'active' : 'completed_internship'
      result = result.filter((i) => i.internship_status === targetStatus)
    }
    if (q) {
      result = result.filter(
        (i) =>
          i.full_name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          (i.university ?? '').toLowerCase().includes(q) ||
          (i.major ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [interns, filter, q])

  const activeIntern = interns.find((i) => i.id === activeId) ?? null

  const filterOptions: FilterStatus[] = ['all', 'active', 'completed']

  return (
    <>
      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {filterOptions.map((status) => {
          const count = counts[status]
          const isActive = filter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {statusLabel(status)}
              <span
                className={cn(
                  'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-border text-muted-foreground',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          weight="bold"
        />
        <Input
          placeholder="Tim kiem sinh vien..."
          aria-label="Tim kiem sinh vien"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((intern) => {
            const progress = internshipProgress(intern.start_date, intern.end_date)
            return (
              <button
                key={intern.id}
                onClick={() => setActiveId(intern.id)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:shadow-card-hover active:scale-[0.99]"
              >
                <Avatar src={intern.avatar_url} name={intern.full_name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{intern.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{intern.email}</p>
                  {intern.university && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {intern.university}{intern.major ? ` - ${intern.major}` : ''}
                    </p>
                  )}
                  {progress && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Tien do</span>
                        <span className="font-medium tabular-nums">{progress.percent}%</span>
                      </div>
                      <Progress value={progress.percent} className="h-1.5" />
                    </div>
                  )}
                </div>
                {intern.internship_status === 'completed_internship' && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                    Xong
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Khong tim thay sinh vien nao.
        </p>
      )}

      <StudentDetailSheet
        internId={activeId}
        intern={activeIntern}
        onClose={() => setActiveId(null)}
      />
    </>
  )
}