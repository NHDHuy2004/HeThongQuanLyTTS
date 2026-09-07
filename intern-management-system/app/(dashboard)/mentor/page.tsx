import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  FileCheck2,
  Users,
  TrendingUp,
  GraduationCap,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function MentorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'mentor') {
    redirect(`/${profile?.role ?? 'login'}`)
  }

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
    .select('id, full_name, email, university, major, avatar_url')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = myInterns?.map((i: any) => i.id) ?? []

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
      .in('status', ['todo', 'doing'])
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
        .select('id, title, status, priority, created_at, profiles!tasks_assignee_id_fkey(full_name)')
        .in('assignee_id', internIds)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const mentorStats = [
    { label: 'TTS do bạn phụ trách', value: String(myInterns?.length ?? 0), icon: GraduationCap, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' },
    { label: 'Đơn chờ bạn duyệt', value: String(pendingRequestCount ?? 0), icon: FileCheck2, color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300' },
    { label: 'Nhiệm vụ TTS đang làm', value: String(openTaskCount), icon: ClipboardCheck, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header with Role Identifier */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-900/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold capitalize text-emerald-700 dark:text-emerald-400">
              {dateFormatted}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
              Người hướng dẫn (Mentor)
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào, {profile.full_name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi tiến độ, điểm danh và duyệt yêu cầu cho nhóm thực tập sinh phụ trách.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        {mentorStats.map((stat) => {
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

      {/* Pending requests requiring attention */}
      {Number(pendingRequestCount) > 0 && (
        <section className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-900/50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-orange-950 dark:text-orange-200 flex items-center gap-2">
              <AlertCircle className="size-4 text-orange-600" />
              Đơn nghỉ phép của TTS cần phê duyệt ({pendingRequestCount})
            </h2>
            <Link href="/mentor/requests">
              <Button size="sm" variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100">Xem tất cả</Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingRequests?.map((req: any) => (
              <div key={req.id} className="rounded-lg border border-orange-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-sm">{req.profiles?.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {req.type === 'leave' ? 'Xin nghỉ phép' : 'Làm việc tại nhà (WFH)'}: {req.start_date} → {req.end_date}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">Lý do: {req.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* List of my interns */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Danh sách Thực tập sinh phụ trách</h2>
            <p className="text-xs text-slate-500">Các sinh viên được phân công cho bạn hướng dẫn</p>
          </div>
          <Link href="/mentor/tasks">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
              <ClipboardCheck className="size-3.5" /> Giao việc cho nhóm
            </Button>
          </Link>
        </div>

        {myInterns?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myInterns.map((intern: any) => (
              <div key={intern.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
                  {intern.full_name.split(' ').map((p: string) => p[0]).join('').slice(-2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{intern.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{intern.email}</p>
                  {(intern.university || intern.major) && (
                    <p className="mt-1.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                      🎓 {intern.university} {intern.major ? `• ${intern.major}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} text="Bạn chưa được phân công phụ trách thực tập sinh nào." />
        )}
      </section>

      {/* Recent tasks from interns */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            <h2 className="font-semibold">Nhiệm vụ đang giao cho TTS</h2>
          </div>
          <Link href="/mentor/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Quản lý nhiệm vụ</Link>
        </div>
        {recentTasks?.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    Phân công cho: {task.profiles?.full_name ?? 'TTS'} · {new Date(task.created_at).toLocaleDateString('vi-VN')}
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
          <EmptyState icon={ClipboardCheck} text="Chưa có nhiệm vụ nào được giao." />
        )}
      </section>
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
