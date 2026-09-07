import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  FileCheck2,
  TrendingUp,
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  AlertCircle,
  ArrowRight,
  CalendarCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect(`/${profile?.role ?? 'login'}`)
  }

  const today = new Date()
  const dateFormatted = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // Counts
  const { count: internCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'intern')
  const { count: mentorCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor')
  const { count: unassignedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'intern').is('mentor_id', null)
  const { count: openTaskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['todo', 'doing'])
  const { count: pendingRequestCount } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  // Recent Tasks
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, created_at, profiles!tasks_assignee_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent Requests
  const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, start_date, end_date, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const adminStats = [
    { label: 'Tổng số Thực tập sinh', value: String(internCount ?? 0), icon: GraduationCap, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300' },
    { label: 'Tổng số Mentor', value: String(mentorCount ?? 0), icon: UserCheck, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' },
    { label: 'TTS chưa phân công Mentor', value: String(unassignedCount ?? 0), icon: AlertCircle, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300' },
    { label: 'Đơn phép chờ duyệt toàn trường', value: String(pendingRequestCount ?? 0), icon: FileCheck2, color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header with Role Identifier */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-900/10 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-amber-500/10 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold capitalize text-rose-700 dark:text-rose-400">
              {dateFormatted}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300">
              Quản trị viên (Admin)
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào, {profile.full_name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Bảng điều khiển quản trị và theo dõi tổng thể hệ thống thực tập sinh.
          </p>
        </div>
      </div>

      {/* Quick Action Alert if unassigned interns exist */}
      {Number(unassignedCount) > 0 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-800/60 dark:bg-amber-950/30 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Có <strong>{unassignedCount}</strong> thực tập sinh mới chưa được phân công Mentor hướng dẫn.
            </p>
          </div>
          <Link href="/admin/interns">
            <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              Phân công ngay <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`rounded-lg p-2 ${stat.color}`}><Icon className="size-4" /></span>
              </div>
              <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
            </div>
          )
        })}
      </section>

      {/* Action shortcuts */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Lối tắt quản trị</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/interns">
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="size-4 text-emerald-600" /> Phân quyền & Quản lý tài khoản
            </Button>
          </Link>
          <Link href="/admin/tasks">
            <Button variant="outline" className="gap-2">
              <ClipboardCheck className="size-4 text-blue-600" /> Giám sát công việc ({openTaskCount ?? 0})
            </Button>
          </Link>
          <Link href="/admin/attendance">
            <Button variant="outline" className="gap-2">
              <CalendarCheck className="size-4 text-emerald-600" /> Theo dõi điểm danh toàn trường
            </Button>
          </Link>
          <Link href="/admin/requests">
            <Button variant="outline" className="gap-2">
              <FileCheck2 className="size-4 text-orange-600" /> Duyệt đơn nghỉ phép / WFH
            </Button>
          </Link>
        </div>
      </section>

      {/* Two columns: Recent Tasks & Recent Requests */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <h2 className="font-semibold">Công việc gần đây</h2>
            </div>
            <Link href="/admin/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Xem tất cả</Link>
          </div>
          {recentTasks?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      Giao cho: {task.profiles?.full_name ?? 'N/A'} · {new Date(task.created_at).toLocaleDateString('vi-VN')}
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
            <EmptyState icon={ClipboardCheck} text="Chưa có công việc nào." />
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-orange-600" />
              <h2 className="font-semibold">Đơn nghỉ phép gần đây</h2>
            </div>
            <Link href="/admin/requests" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Xem tất cả</Link>
          </div>
          {recentRequests?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{req.profiles?.full_name ?? 'Thực tập sinh'}</p>
                    <p className="text-xs text-slate-400">
                      {req.type === 'leave' ? 'Nghỉ phép' : 'WFH'}: {req.start_date} → {req.end_date}
                    </p>
                  </div>
                  <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileCheck2} text="Chưa có đơn nghỉ phép." />
          )}
        </section>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon className="size-8 text-slate-300 dark:text-slate-700" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
