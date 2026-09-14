'use client'

import { useEffect, useState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { BottomSheet } from './bottom-sheet'
import { Avatar } from './avatar'
import { Badge, statusLabel, statusVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from './stat-card'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, internshipProgress } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface InternSummary {
  id: string
  full_name: string
  email: string
  university: string | null
  major: string | null
  avatar_url: string | null
  start_date: string | null
  end_date: string | null
  internship_status: string
}

interface TaskBrief {
  id: string
  title: string
  status: string
  deadline: string | null
  created_at: string
}

interface RequestBrief {
  id: string
  type: 'leave' | 'wfh'
  status: string
  start_date: string
  end_date: string
  created_at: string
}

interface ReportBrief {
  id: string
  status: string
  period_number: number | null
  submitted_at: string | null
  created_at: string
}

interface InternDetailData {
  tasks: TaskBrief[]
  requests: RequestBrief[]
  reports: ReportBrief[]
  overdueCount: number
}

export function StudentDetailSheet({
  internId,
  intern,
  onClose,
}: {
  internId: string | null
  intern: InternSummary | null
  onClose: () => void
}) {
  const [detail, setDetail] = useState<InternDetailData | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!internId) return
    const id = internId
    let active = true

    async function load() {
      const supabase = createClient()
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, deadline, created_at')
        .eq('assignee_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
      const { data: requests } = await supabase
        .from('leave_requests')
        .select('id, type, status, start_date, end_date, created_at')
        .eq('intern_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
      const { data: reports } = await supabase
        .from('periodic_reports')
        .select('id, status, period_number, submitted_at, created_at')
        .eq('intern_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (active) {
        const taskList = (tasks ?? []) as TaskBrief[]
        const now = Date.now()
        const openTasks = taskList.filter((t) =>
          ['pending_acceptance', 'in_progress', 'under_review'].includes(t.status),
        )
        setDetail({
          tasks: taskList,
          requests: (requests ?? []) as RequestBrief[],
          reports: (reports ?? []) as ReportBrief[],
          overdueCount: openTasks.filter(
            (t) => t.deadline && new Date(t.deadline).getTime() < now,
          ).length,
        })
        setErrorText(null)
      }
    }

    load().catch(() => {
      if (active) setErrorText('Khong the tai du lieu.')
    })

    return () => {
      active = false
    }
  }, [internId, attempt])

  const loading = !!internId && detail === null && errorText === null

  const tasks = detail?.tasks ?? []
  const requests = detail?.requests ?? []
  const reports = detail?.reports ?? []
  const openTasks = tasks.filter((t) => ['pending_acceptance', 'in_progress', 'under_review'].includes(t.status))
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const progress = internshipProgress(intern?.start_date ?? null, intern?.end_date ?? null)

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <BottomSheet open={internId !== null} onClose={onClose} title="Ho so sinh vien">
      {intern && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar src={intern.avatar_url} name={intern.full_name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold tracking-tight">{intern.full_name}</p>
                {intern.internship_status === 'completed_internship' && (
                  <Badge variant="success" className="shrink-0 text-[10px]">Xong</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{intern.email}</p>
              {intern.university && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {intern.university}{intern.major ? ` - ${intern.major}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Period + progress */}
          {(progress || (intern.start_date && intern.end_date)) && (
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarBlank className="size-3.5" weight="bold" />
                  {formatDate(intern.start_date)} den {formatDate(intern.end_date)}
                </span>
                {progress && (
                  <span className="font-medium tabular-nums">{progress.percent}%</span>
                )}
              </div>
              {progress && <Progress value={progress.percent} className="h-1.5" />}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard label="Dang lam" value={openTasks.length} icon={ClipboardText} tone="primary" />
            <StatCard label="Hoan thanh" value={completedTasks.length} icon={GraduationCap} tone="success" />
            <StatCard
              label="Tre han"
              value={detail?.overdueCount ?? 0}
              icon={WarningCircle}
              tone={(detail?.overdueCount ?? 0) > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              label="Don cho duyet"
              value={pendingRequests.length}
              icon={CalendarBlank}
              tone={pendingRequests.length > 0 ? 'warning' : 'neutral'}
            />
          </div>

          {/* Content area */}
          {loading && (
            <div className="mt-5 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {errorText && !loading && (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm font-medium text-destructive">{errorText}</p>
              <Button onClick={() => setAttempt((a) => a + 1)} variant="outline" className="h-10">
                Thu lai
              </Button>
            </div>
          )}

          {!loading && !errorText && (
            <>
              {/* Recent tasks */}
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Viec gan day ({tasks.length})
                </h3>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-sm font-medium', task.status === 'completed' && 'line-through')}>
                            {task.title}
                          </p>
                          {task.deadline && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                              Han: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusVariant(task.status)} className="shrink-0 text-[10px]">
                          {statusLabel(task.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chua co viec nao duoc giao.</p>
                )}
              </div>

              {/* Recent requests */}
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Don xin nghi ({requests.length})
                </h3>
                {requests.length > 0 ? (
                  <div className="space-y-2">
                    {requests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {req.type === 'leave' ? 'Xin nghi phep' : 'Xin WFH'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                            {formatDate(req.start_date)} den {formatDate(req.end_date)} -{' '}
                            {formatRelativeTime(req.created_at)}
                          </p>
                        </div>
                        <Badge variant={statusVariant(req.status)} className="shrink-0 text-[10px]">
                          {statusLabel(req.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chua co don nao.</p>
                )}
              </div>

              {/* Periodic reports */}
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Bao cao dinh ky ({reports.length})
                </h3>
                {reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.slice(0, 5).map((rpt) => (
                      <div
                        key={rpt.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="size-3.5 shrink-0 text-muted-foreground" weight="bold" />
                            <p className="truncate text-sm font-medium">
                              Ky {rpt.period_number ?? '-'}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                            {rpt.submitted_at
                              ? `Nop ${formatRelativeTime(rpt.submitted_at)}`
                              : formatRelativeTime(rpt.created_at)
                            }
                          </p>
                        </div>
                        <Badge variant={statusVariant(rpt.status)} className="shrink-0 text-[10px]">
                          {statusLabel(rpt.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chua co bao cao nao.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  )
}