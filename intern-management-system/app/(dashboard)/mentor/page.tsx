import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr/ChartLineUp'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { daysBetween, todayInVietnam } from '@/lib/format'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/page/empty-state'
import { InternshipProgress } from '@/components/interns/internship-progress'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { StatCard } from '@/components/page/stat-card'

const EVAL_WINDOW_DAYS = 7

function needsFinalEvaluation(intern: { start_date: string | null; end_date: string | null; internship_status: string }): boolean {
  if (!intern.end_date) return false
  if (intern.internship_status === 'completed_internship') return false
  return daysBetween(todayInVietnam(), intern.end_date) <= EVAL_WINDOW_DAYS
}

export default async function MentorDashboardPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'mentor') redirect(`/${profile.role}`)

  const today = new Date()
  const dateFormatted = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // Interns assigned to this mentor
  const { data: myInterns } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, university, major, avatar_url, start_date, end_date, internship_status',
    )
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = myInterns?.map((i: any) => i.id) ?? []
  const finalEvalDueCount = (myInterns ?? []).filter(needsFinalEvaluation).length

  // Pending requests for this mentor
  const { count: pendingRequestCount } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)
    .eq('status', 'pending')

  // Open tasks for this mentor's interns
  let openTaskCount = 0
  if (internIds.length > 0) {
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('assignee_id', internIds)
      .in('status', ['pending_acceptance', 'in_progress', 'under_review'])
    openTaskCount = count ?? 0
  }

  // Recent requests needing review
  const { data: pendingRequests } = await supabase
    .from('leave_requests')
    .select('id, type, reason, start_date, end_date, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .eq('mentor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent tasks of my interns
  const { data: recentTasks } = internIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, title, status, priority, created_at, profiles!tasks_assignee_id_fkey(full_name), creators:profiles!tasks_creator_id_fkey(full_name)')
        .in('assignee_id', internIds)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${dateFormatted} - Người hướng dẫn (Mentor)`}
        title={`Xin chào, ${profile.full_name}`}
        description="Theo dõi tiến độ, điểm danh và duyệt yêu cầu cho nhóm thực tập sinh phụ trách."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="TTS do bạn phụ trách" value={myInterns?.length ?? 0} icon={GraduationCap} tone="primary" />
        <StatCard label="Đơn chờ bạn duyệt" value={pendingRequestCount ?? 0} icon={CalendarBlank} tone="warning" />
        <StatCard label="Nhiệm vụ TTS đang làm" value={openTaskCount} icon={ClipboardText} tone="success" />
      </section>

      {Number(pendingRequestCount) > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/15 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <WarningCircle className="size-5 shrink-0 text-warning-foreground" weight="bold" />
            <p className="text-sm font-medium text-foreground">
              Có <strong>{pendingRequestCount}</strong> đơn nghỉ phép của thực tập sinh đang chờ bạn phê duyệt.
            </p>
          </div>
          <Link href="/mentor/requests">
            <Button size="sm">
              Xem tất cả <ArrowRight className="size-3.5" weight="bold" />
            </Button>
          </Link>
        </div>
      )}

      <SectionCard>
        <SectionHeader
          title="Đơn nghỉ phép cần phê duyệt"
          icon={CalendarBlank}
          action={
            <Link href="/mentor/requests" className="text-xs font-medium text-primary hover:underline">
              Xem tất cả
            </Link>
          }
        />
        {pendingRequests?.length ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium">{req.profiles?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {req.type === 'leave' ? 'Xin nghỉ phép' : 'Làm việc tại nhà (WFH)'}: {req.start_date} đến {req.end_date}
                </p>
                {req.reason && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Lý do: {req.reason}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarBlank}
            title="Không có đơn cần duyệt"
            description="Các đơn xin nghỉ phép hoặc WFH chờ phê duyệt sẽ xuất hiện ở đây."
          />
        )}
      </SectionCard>

      {finalEvalDueCount > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/15 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <WarningCircle className="size-5 shrink-0 text-warning-foreground" weight="bold" />
            <p className="text-sm font-medium text-foreground">
              Có <strong>{finalEvalDueCount}</strong> thực tập sinh đến kỳ đánh giá tổng quan cuối kỳ.
              Hoàn thành đánh giá để giúp TTS nhận Giấy chứng nhận.
            </p>
          </div>
          <Link href="/mentor/final-evaluations">
            <Button size="sm">
              Đánh giá ngay <ArrowRight className="size-3.5" weight="bold" />
            </Button>
          </Link>
        </div>
      )}

      <SectionCard>
        <SectionHeader
          title="Danh sách Thực tập sinh phụ trách"
          description="Các sinh viên được phân công cho bạn hướng dẫn"
          icon={Users}
          action={
            <Link href="/mentor/tasks">
              <Button size="sm" className="gap-1.5">
                <ClipboardText className="size-3.5" weight="bold" /> Giao việc cho nhóm
              </Button>
            </Link>
          }
        />
        {myInterns?.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {myInterns.map((intern: any) => (
              <div key={intern.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <GraduationCap className="size-5" weight="bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{intern.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{intern.email}</p>
                    {(intern.university || intern.major) && (
                      <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                        {intern.university}
                        {intern.university && intern.major ? ' - ' : ''}
                        {intern.major}
                      </p>
                    )}
                  </div>
                </div>
                <InternshipProgress startDate={intern.start_date} endDate={intern.end_date} />
                {intern.internship_status === 'completed_internship' && (
                  <Badge variant="success" className="self-start">
                    Đã hoàn thành thực tập
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Bạn chưa được phân công phụ trách thực tập sinh nào"
            description="Khi được phân công, danh sách thực tập sinh của bạn sẽ hiển thị ở đây."
          />
        )}
      </SectionCard>

      <SectionCard>
        <SectionHeader
          title="Nhiệm vụ đang giao cho TTS"
          icon={ChartLineUp}
          action={
            <Link href="/mentor/tasks" className="text-xs font-medium text-primary hover:underline">
              Quản lý nhiệm vụ
            </Link>
          }
        />
        {recentTasks?.length ? (
          <div className="divide-y divide-border">
            {recentTasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
<p className="mt-0.5 text-xs text-muted-foreground">
                      Người giao: {task.creators?.full_name ?? 'N/A'} - Phân công cho: {task.profiles?.full_name ?? 'TTS'} - {new Date(task.created_at).toLocaleDateString('vi-VN')}
                    </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Badge variant={statusVariant(task.priority)}>{statusLabel(task.priority)}</Badge>
                  <Badge variant={statusVariant(task.status)}>{statusLabel(task.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardText}
            title="Chưa có nhiệm vụ nào được giao"
            description="Các nhiệm vụ được giao cho thực tập sinh sẽ xuất hiện ở đây."
          />
        )}
      </SectionCard>
    </div>
  )
}
