import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Hourglass } from '@phosphor-icons/react/dist/ssr/Hourglass'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { todayInVietnam } from '@/lib/format'
import { Avatar } from '@/components/mentor-app/avatar'
import { NotificationBadge } from '@/components/mentor-app/notification-badge'
import { NotificationsRealtime } from '@/components/mentor-app/notifications-realtime'
import { DashboardStat } from '@/components/mentor-app/dashboard-stat'
import { TaskReviewCard, type ReviewTask } from '@/components/mentor-app/task-review-card'
import { EmptyState } from '@/components/mentor-app/empty-state'

export default async function HomePage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = interns?.map((i) => i.id) ?? []
  const nowIso = new Date().toISOString()

  const hasInterns = internIds.length > 0

  const [pendingReview, inProgress, overdue, weeklyReports] = hasInterns
    ? await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('assignee_id', internIds)
          .eq('status', 'under_review'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('assignee_id', internIds)
          .eq('status', 'in_progress'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('assignee_id', internIds)
          .in('status', ['pending_acceptance', 'in_progress'])
          .not('deadline', 'is', null)
          .lt('deadline', nowIso),
        supabase
          .from('periodic_reports')
          .select('*', { count: 'exact', head: true })
          .in('intern_id', internIds)
          .eq('status', 'submitted'),
      ])
    : ([{ count: null }, { count: null }, { count: null }, { count: null }] as const)

  const { data: reviewTasks } = hasInterns
    ? await supabase
        .from('tasks')
        .select('id, title, category, submitted_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url)')
        .in('assignee_id', internIds)
        .eq('status', 'under_review')
        .order('submitted_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const { count: checkedIn } = hasInterns
    ? await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .in('intern_id', internIds)
        .eq('date', todayInVietnam())
        .not('check_in_time', 'is', null)
    : { count: null }

  const overdueCount = overdue?.count ?? 0
  const tasks = (reviewTasks ?? []) as unknown as ReviewTask[]

  return (
    <div className="flex flex-col pb-20">
      <NotificationsRealtime userId={user.id} internIds={internIds} />

      {/* Header */}
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Xin chào,</p>
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {profile.full_name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <NotificationBadge userId={user.id} internIds={internIds} />
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name ?? 'M'}
            size={40}
            className="rounded-full border border-border"
          />
        </div>
      </header>

      {/* Stats Summary */}
      <div className="my-3 grid grid-cols-2 gap-3">
        <DashboardStat
          label="Chờ duyệt"
          value={pendingReview?.count ?? 0}
          icon={Hourglass}
          tone="warning"
        />
        <DashboardStat
          label="Đang thực hiện"
          value={inProgress?.count ?? 0}
          icon={ClipboardText}
        />
        <DashboardStat
          label="Trễ hạn"
          value={overdueCount}
          icon={WarningCircle}
          tone={overdueCount > 0 ? 'danger' : 'primary'}
        />
        <DashboardStat
          label="Báo cáo tuần"
          value={weeklyReports?.count ?? 0}
          icon={FileText}
        />
      </div>

      {/* Task cần nghiệm thu */}
      <div className="mt-3 mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Task cần nghiệm thu</h2>
        <Link
          href="/mentor-app/tasks"
          className="flex items-center gap-0.5 text-xs font-medium text-primary"
        >
          Xem tất cả
          <ArrowRight className="size-3.5" weight="bold" />
        </Link>
      </div>

      {tasks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskReviewCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardText}
          title="Không có task chờ duyệt"
          description="Bài nộp mới của thực tập sinh sẽ xuất hiện tại đây."
        />
      )}

      {/* Điểm danh hôm nay */}
      {hasInterns && (
        <div className="mt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersThree className="size-5" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Điểm danh hôm nay</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {checkedIn ?? 0}/{internIds.length} Thực tập sinh đã Check-in
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}