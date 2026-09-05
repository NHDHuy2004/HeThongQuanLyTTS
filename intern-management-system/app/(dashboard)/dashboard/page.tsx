import { ClipboardCheck, Clock3, FileCheck2, Users, TrendingUp, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, mentor_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const isAdmin = profile.role === 'admin'
  const isMentor = profile.role === 'mentor'
  const isIntern = profile.role === 'intern'

  // Fetch task counts
  const { count: openTaskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('status', ['todo', 'doing'])

  // Fetch weekly hours (for interns)
  let weeklyHours = 0
  if (isIntern) {
    const weekStart = getMonday(new Date()).toISOString().slice(0, 10)
    const { data: weekRecords } = await supabase
      .from('attendance')
      .select('total_hours')
      .eq('intern_id', user.id)
      .gte('date', weekStart)
    weeklyHours = weekRecords?.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) ?? 0
  }

  // Fetch pending requests count
  const { count: pendingRequestCount } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Fetch intern count (admin/mentor)
  let internCount = 0
  if (isAdmin) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'intern')
    internCount = count ?? 0
  } else if (isMentor) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('mentor_id', user.id)
      .eq('role', 'intern')
    internCount = count ?? 0
  }

  // Recent tasks
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent requests
  const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, start_date, end_date, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const today = new Date()
  const dateStr = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const stats = [
    {
      label: 'Công việc đang mở',
      value: String(openTaskCount ?? 0),
      icon: ClipboardCheck,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    {
      label: isIntern ? 'Giờ làm tuần này' : 'Đơn chờ duyệt',
      value: isIntern ? `${weeklyHours.toFixed(1)}h` : String(pendingRequestCount ?? 0),
      icon: isIntern ? Clock3 : FileCheck2,
      color: isIntern
        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300'
        : 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300',
    },
    {
      label: isIntern ? 'Đơn chờ duyệt' : 'Thực tập sinh',
      value: isIntern ? String(pendingRequestCount ?? 0) : String(internCount),
      icon: isIntern ? FileCheck2 : Users,
      color: isIntern
        ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300',
    },
  ]

  // Admin/Mentor gets all 4 stats
  if (!isIntern) {
    stats.splice(1, 0, {
      label: 'Đơn chờ duyệt',
      value: String(pendingRequestCount ?? 0),
      icon: FileCheck2,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300',
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-emerald-700 capitalize dark:text-emerald-400">{dateStr}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Xin chào, {profile.full_name} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi hoạt động thực tập sinh của bạn.
        </p>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`rounded-lg p-2 ${stat.color}`}>
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
            </div>
          )
        })}
      </section>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <TrendingUp className="size-4 text-emerald-600" />
            <h2 className="font-semibold">Công việc gần đây</h2>
          </div>
          {recentTasks?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(task.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Badge variant={statusVariant(task.priority)}>
                      {statusLabel(task.priority)}
                    </Badge>
                    <Badge variant={statusVariant(task.status)}>
                      {statusLabel(task.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} text="Chưa có công việc nào." />
          )}
        </section>

        {/* Recent Requests */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <CalendarDays className="size-4 text-amber-600" />
            <h2 className="font-semibold">Đơn nghỉ phép gần đây</h2>
          </div>
          {recentRequests?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {req.type === 'leave' ? 'Nghỉ phép' : 'WFH'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {req.start_date} → {req.end_date}
                    </p>
                  </div>
                  <Badge variant={statusVariant(req.status)}>
                    {statusLabel(req.status)}
                  </Badge>
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

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}