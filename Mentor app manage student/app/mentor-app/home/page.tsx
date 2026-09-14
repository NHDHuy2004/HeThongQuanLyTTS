import { redirect } from 'next/navigation'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { ClockCounterClockwise } from '@phosphor-icons/react/dist/ssr/ClockCounterClockwise'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Badge, statusLabel, statusVariant } from '@/components/ui/badge'
import { StatCard } from '@/components/mentor-app/stat-card'
import { SectionCard, SectionHeader } from '@/components/mentor-app/section-card'
import { EmptyState } from '@/components/mentor-app/empty-state'
import { NotificationsRealtime } from '@/components/mentor-app/notifications-realtime'
import { formatRelativeTime } from '@/lib/format'
import type { Icon } from '@phosphor-icons/react'

interface Activity {
  id: string
  type: 'task_action' | 'request' | 'report'
  title: string
  subtitle: string
  status: string
  time: string
}

export default async function HomePage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: myInterns } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = myInterns?.map((i) => i.id) ?? []

  let openTaskCount = 0
  let overdueTaskCount = 0
  let pendingReportCount = 0

  if (internIds.length > 0) {
    const { count: openCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('assignee_id', internIds)
      .in('status', ['pending_acceptance', 'in_progress', 'under_review'])
    openTaskCount = openCount ?? 0

    const { count: overdueCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('assignee_id', internIds)
      .in('status', ['pending_acceptance', 'in_progress'])
      .not('deadline', 'is', null)
      .lt('deadline', new Date().toISOString())
    overdueTaskCount = overdueCount ?? 0

    const { count: reportCount } = await supabase
      .from('periodic_reports')
      .select('*', { count: 'exact', head: true })
      .in('intern_id', internIds)
      .eq('status', 'submitted')
    pendingReportCount = reportCount ?? 0
  }

  const { count: pendingRequestCount } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)
    .eq('status', 'pending')

  // Recent activity feed
  interface RecentTaskRow {
    id: string
    title: string
    status: string
    submitted_at: string | null
    completed_at: string | null
    created_at: string
    profiles: { full_name: string | null } | null
  }
  interface RecentRequestRow {
    id: string
    type: string
    status: string
    created_at: string
    profiles: { full_name: string | null } | null
  }
  interface RecentReportRow {
    id: string
    period_number: number | null
    status: string
    submitted_at: string | null
    created_at: string
    profiles: { full_name: string | null } | null
  }

const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  let recentTasks: RecentTaskRow[] | null = null
  let recentReports: RecentReportRow[] | null = null
  if (internIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, submitted_at, completed_at, created_at, profiles!tasks_assignee_id_fkey(full_name)')
      .in('assignee_id', internIds)
      .order('created_at', { ascending: false })
      .limit(10)
    recentTasks = (tasks ?? []) as RecentTaskRow[]

    const { data: reports } = await supabase
      .from('periodic_reports')
      .select('id, status, period_number, submitted_at, created_at, profiles!periodic_reports_intern_id_fkey(full_name)')
      .in('intern_id', internIds)
      .order('created_at', { ascending: false })
      .limit(5)
    recentReports = (reports ?? []) as RecentReportRow[]
  }

  const taskRows = recentTasks ?? []
  const requestRows = (recentRequests ?? []) as RecentRequestRow[]
  const reportRows = recentReports ?? []

  const activities: Activity[] = [
    ...taskRows.map((t) => {
      if (t.status === 'under_review') {
        return {
          id: t.id,
          type: 'task_action' as const,
          title: `Nop bai: ${t.title}`,
          subtitle: t.profiles?.full_name ?? 'N/A',
          status: t.status,
          time: t.submitted_at ?? t.created_at,
        }
      }
      if (t.status === 'completed') {
        return {
          id: t.id,
          type: 'task_action' as const,
          title: `Duyet bai: ${t.title}`,
          subtitle: t.profiles?.full_name ?? 'N/A',
          status: t.status,
          time: t.completed_at ?? t.created_at,
        }
      }
      return {
        id: t.id,
        type: 'task_action' as const,
        title: `Giao viec: ${t.title}`,
        subtitle: t.profiles?.full_name ?? 'N/A',
        status: t.status,
        time: t.created_at,
      }
    }),
    ...requestRows.map((r) => ({
      id: r.id,
      type: 'request' as const,
      title: r.type === 'leave' ? 'Xin nghi phep' : 'Xin WFH',
      subtitle: r.profiles?.full_name ?? 'N/A',
      status: r.status,
      time: r.created_at,
    })),
    ...reportRows.map((r) => ({
      id: r.id,
      type: 'report' as const,
      title: `Bao cao dinh ky${r.period_number ? ` (Ky ${r.period_number})` : ''}`,
      subtitle: r.profiles?.full_name ?? 'N/A',
      status: r.status,
      time: r.submitted_at ?? r.created_at,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)

  const activityIcons: Record<Activity['type'], Icon> = {
    task_action: ClipboardText,
    request: CalendarCheck,
    report: FileText,
  }

  return (
    <div className="space-y-4">
      <NotificationsRealtime userId={user.id} internIds={internIds} />
      {/* Greeting */}
      <div className="rounded-xl bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">Xin chao,</p>
        <p className="text-lg font-semibold tracking-tight">{profile.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="TTS phu trach"
          value={myInterns?.length ?? 0}
          icon={GraduationCap}
          tone="primary"
        />
        <StatCard
          label="Viec dang lam"
          value={openTaskCount}
          icon={ClipboardText}
          tone="success"
        />
        <StatCard
          label="Tre han"
          value={overdueTaskCount}
          icon={WarningCircle}
          tone={overdueTaskCount > 0 ? 'danger' : 'neutral'}
        />
        <StatCard
          label="Don cho duyet"
          value={(pendingRequestCount ?? 0) + pendingReportCount}
          icon={CalendarBlank}
          tone={(pendingRequestCount ?? 0) + pendingReportCount > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Pending Requests Alert */}
      {(pendingRequestCount ?? 0) > 0 && (
        <a
          href="/mentor-app/notifications"
          className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3.5 transition-colors active:scale-[0.99]"
        >
          <WarningCircle className="size-5 shrink-0 text-warning-foreground" weight="bold" />
          <p className="text-sm font-medium">
            Ban co <strong>{pendingRequestCount}</strong> don can duyet
          </p>
        </a>
      )}

      {/* Recent Activity */}
      <SectionCard>
        <SectionHeader
          title="Hoat dong gan day"
          icon={ClipboardText}
        />
        {activities.length > 0 ? (
          <div className="space-y-1">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" weight="bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {activity.subtitle}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={statusVariant(activity.status)} className="text-[10px]">
                      {statusLabel(activity.status)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(activity.time)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={ClockCounterClockwise}
            title="Chua co hoat dong nao"
            description="Cac hoat dong gan day se hien thi tai day."
          />
        )}
      </SectionCard>
    </div>
  )
}
