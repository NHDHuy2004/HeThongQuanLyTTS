import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { ChartLineUp } from '@phosphor-icons/react/dist/ssr/ChartLineUp'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/page/empty-state'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { StatCard } from '@/components/page/stat-card'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'admin') redirect(`/${profile.role}`)

  const dateFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const { count: internCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'intern')
  const { count: mentorCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor')
  const { count: unassignedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'intern').is('mentor_id', null)
  const { count: openTaskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['pending_acceptance', 'in_progress', 'under_review'])
  const { count: pendingRequestCount } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, created_at, profiles!tasks_assignee_id_fkey(full_name), creators:profiles!tasks_creator_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, start_date, end_date, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={dateFormatted}
        title={`Xin chào, ${profile.full_name}`}
        description="Bảng điều khiển quản trị và theo dõi tổng thể hệ thống thực tập sinh."
      />

      {Number(unassignedCount) > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/15 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <WarningCircle className="size-5 shrink-0 text-warning-foreground" weight="bold" />
            <p className="text-sm font-medium text-foreground">
              Có <strong>{unassignedCount}</strong> thực tập sinh mới chưa được phân công Mentor hướng dẫn.
            </p>
          </div>
          <Link href="/admin/interns">
            <Button size="sm">
              Phân công ngay <ArrowRight className="size-3.5" weight="bold" />
            </Button>
          </Link>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng số thực tập sinh" value={internCount ?? 0} icon={GraduationCap} tone="primary" />
        <StatCard label="Tổng số Mentor" value={mentorCount ?? 0} icon={UserCheck} tone="success" />
        <StatCard label="Chưa phân công Mentor" value={unassignedCount ?? 0} icon={Users} tone="warning" />
        <StatCard label="Đơn phép chờ duyệt" value={pendingRequestCount ?? 0} icon={SealCheck} tone="danger" />
      </section>

      <SectionCard>
        <SectionHeader title="Lối tắt quản trị" />
        <div className="flex flex-wrap gap-3 p-5">
          <Link href="/admin/interns">
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="size-4 text-primary" weight="bold" /> Phân quyền và quản lý tài khoản
            </Button>
          </Link>
          <Link href="/admin/tasks">
            <Button variant="outline" className="gap-2">
              <ClipboardText className="size-4 text-primary" weight="bold" /> Giám sát công việc ({openTaskCount ?? 0})
            </Button>
          </Link>
          <Link href="/admin/attendance">
            <Button variant="outline" className="gap-2">
              <CalendarCheck className="size-4 text-primary" weight="bold" /> Theo dõi điểm danh toàn trường
            </Button>
          </Link>
          <Link href="/admin/requests">
            <Button variant="outline" className="gap-2">
              <SealCheck className="size-4 text-primary" weight="bold" /> Duyệt đơn nghỉ phép và WFH
            </Button>
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHeader
            title="Công việc gần đây"
            icon={ChartLineUp}
            action={
              <Link href="/admin/tasks" className="text-xs font-medium text-primary hover:underline">
                Xem tất cả
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
                      Người giao: {task.creators?.full_name ?? 'N/A'} - Giao cho: {task.profiles?.full_name ?? 'N/A'} - {new Date(task.created_at).toLocaleDateString('vi-VN')}
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
              title="Chưa có công việc nào"
              description="Công việc mới phát sinh sẽ xuất hiện ở đây."
            />
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader
            title="Đơn nghỉ phép gần đây"
            icon={CalendarBlank}
            action={
              <Link href="/admin/requests" className="text-xs font-medium text-primary hover:underline">
                Xem tất cả
              </Link>
            }
          />
          {recentRequests?.length ? (
            <div className="divide-y divide-border">
              {recentRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{req.profiles?.full_name ?? 'Thực tập sinh'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {req.type === 'leave' ? 'Nghỉ phép' : 'WFH'}: {req.start_date} đến {req.end_date}
                    </p>
                  </div>
                  <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SealCheck}
              title="Chưa có đơn nghỉ phép"
              description="Các đơn xin nghỉ phép hoặc WFH sẽ xuất hiện ở đây."
            />
          )}
        </SectionCard>
      </div>
    </div>
  )
}