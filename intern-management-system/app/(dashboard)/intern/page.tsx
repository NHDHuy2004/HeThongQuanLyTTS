import Link from 'next/link'
import {
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Users,
  TrendingUp,
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  Star,
  UserCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { checkIn, checkOut } from './attendance/actions'

type Role = 'admin' | 'mentor' | 'intern'

const roleBadges: Record<Role, { label: string; color: string }> = {
  admin: { label: 'Quản trị viên', color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50' },
  mentor: { label: 'Mentor', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50' },
  intern: { label: 'Thực tập sinh', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/50' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, mentor_id, university, major')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const role = (profile.role ?? 'intern') as Role
  const today = new Date()
  const todayDateStr = today.toISOString().slice(0, 10)
  const dateFormatted = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const currentBadge = roleBadges[role] ?? roleBadges.intern

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
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentBadge.color}`}>
              {currentBadge.label}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào, {profile.full_name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {profile.role === 'admin' && 'Bảng điều khiển quản trị và theo dõi tổng thể hệ thống thực tập.'}
            {profile.role === 'mentor' && 'Theo dõi tiến độ, điểm danh và duyệt yêu cầu cho nhóm thực tập sinh.'}
            {profile.role === 'intern' && 'Không gian làm việc, chấm công và theo dõi kết quả thực tập cá nhân.'}
          </p>
        </div>
      </div>

      {profile.role === 'admin' && <AdminDashboardView supabase={supabase} />}
      {profile.role === 'mentor' && <MentorDashboardView supabase={supabase} userId={user.id} />}
      {profile.role === 'intern' && (
        <InternDashboardView
          supabase={supabase}
          userId={user.id}
          profile={profile}
          todayStr={todayDateStr}
        />
      )}
    </div>
  )
}

/* ========================================================================== */
/* ADMIN DASHBOARD VIEW                                                       */
/* ========================================================================== */
async function AdminDashboardView({ supabase }: { supabase: any }) {
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
    <div className="space-y-8">
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
          <Link href="/intern/tasks">
            <Button variant="outline" className="gap-2">
              <ClipboardCheck className="size-4 text-blue-600" /> Giám sát công việc ({openTaskCount ?? 0})
            </Button>
          </Link>
          <Link href="/intern/attendance">
            <Button variant="outline" className="gap-2">
              <CalendarCheck className="size-4 text-emerald-600" /> Theo dõi điểm danh toàn trường
            </Button>
          </Link>
          <Link href="/intern/requests">
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
                    <Link href="/intern/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Xem tất cả</Link>
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
                    <Link href="/intern/requests" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Xem tất cả</Link>
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

/* ========================================================================== */
/* MENTOR DASHBOARD VIEW                                                      */
/* ========================================================================== */
async function MentorDashboardView({ supabase, userId }: { supabase: any; userId: string }) {
  // Interns assigned to this mentor
  const { data: myInterns } = await supabase
    .from('profiles')
    .select('id, full_name, email, university, major, avatar_url')
    .eq('mentor_id', userId)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = myInterns?.map((i: any) => i.id) ?? []

  // Pending requests for this mentor
  const { count: pendingRequestCount } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', userId)
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
    .eq('mentor_id', userId)
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
    <div className="space-y-8">
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
            <Link href="/intern/requests">
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
          <Link href="/intern/tasks">
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
          <Link href="/intern/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">Quản lý nhiệm vụ</Link>
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

/* ========================================================================== */
/* INTERN DASHBOARD VIEW                                                      */
/* ========================================================================== */
async function InternDashboardView({
  supabase,
  userId,
  profile,
  todayStr,
}: {
  supabase: any
  userId: string
  profile: any
  todayStr: string
}) {
  // Today's attendance record
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('check_in_time, check_out_time, total_hours, status')
    .eq('intern_id', userId)
    .eq('date', todayStr)
    .maybeSingle()

  const canCheckIn = !todayRecord?.check_in_time
  const canCheckOut = Boolean(todayRecord?.check_in_time && !todayRecord?.check_out_time)

  // Mentor profile
  let mentorInfo: any = null
  if (profile.mentor_id) {
    const { data: mentor } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', profile.mentor_id)
      .maybeSingle()
    mentorInfo = mentor
  }

  // Weekly hours
  const weekStart = getMonday(new Date()).toISOString().slice(0, 10)
  const { data: weekRecords } = await supabase
    .from('attendance')
    .select('total_hours')
    .eq('intern_id', userId)
    .gte('date', weekStart)
  const weeklyHours = weekRecords?.reduce((sum: number, r: any) => sum + (r.total_hours ?? 0), 0) ?? 0

  // My open tasks
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, created_at, deadline')
    .eq('assignee_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  // My pending requests
  const { data: myRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, start_date, end_date, created_at')
    .eq('intern_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  // Latest evaluation
  const { data: latestEvaluation } = await supabase
    .from('evaluations')
    .select('id, type_period, scores_json, feedback, created_at')
    .eq('intern_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-8">
      {/* Top Banner: Quick Attendance & Mentor info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Attendance Card with Quick Action */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-6 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900 md:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CalendarCheck className="size-4" /> Điểm danh hôm nay
              </span>
              <p className="mt-2 text-2xl font-bold">
                {todayRecord?.check_out_time
                  ? 'Đã hoàn tất ngày làm việc'
                  : todayRecord?.check_in_time
                  ? 'Đang làm việc'
                  : 'Chưa check-in'}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span>Vào: <strong>{formatTime(todayRecord?.check_in_time)}</strong></span>
                <span>Ra: <strong>{formatTime(todayRecord?.check_out_time)}</strong></span>
                {todayRecord?.total_hours && (
                  <span className="text-emerald-700 font-semibold dark:text-emerald-400">
                    Tổng: {todayRecord.total_hours} giờ
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form action={checkIn}>
                <Button
                  type="submit"
                  disabled={!canCheckIn}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  Check-in ngay
                </Button>
              </form>
              <form action={checkOut}>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!canCheckOut}
                  className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300"
                >
                  Check-out
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Mentor Info Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <UserCheck className="size-4 text-blue-600" /> Mentor phụ trách
          </span>
          {mentorInfo ? (
            <div className="mt-3">
              <p className="text-base font-bold text-slate-900 dark:text-white">{mentorInfo.full_name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{mentorInfo.email}</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-3 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Đã phân công chính thức
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-slate-500">Chưa được phân công</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Vui lòng liên hệ Admin để được chỉ định người hướng dẫn.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Intern Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Giờ làm tuần này</p>
            <span className="rounded-lg p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Clock3 className="size-4" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{weeklyHours.toFixed(1)}h</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Nhiệm vụ của bạn</p>
            <span className="rounded-lg p-2 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <ClipboardCheck className="size-4" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{myTasks?.length ?? 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Đơn nghỉ đang duyệt</p>
            <span className="rounded-lg p-2 bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
              <FileCheck2 className="size-4" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {myRequests?.filter((r: any) => r.status === 'pending').length ?? 0}
          </p>
        </div>
      </section>

      {/* Two columns: My Tasks & My Requests */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-emerald-600" />
              <h2 className="font-semibold">Công việc của bạn</h2>
            </div>
            <Link href="/intern/tasks" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Xem bảng công việc
            </Link>
          </div>
          {myTasks?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      Hạn chót: {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'Không có hạn'}
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
            <EmptyState icon={ClipboardCheck} text="Bạn chưa có công việc nào được giao." />
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-orange-600" />
              <h2 className="font-semibold">Đơn xin nghỉ phép / WFH của bạn</h2>
            </div>
            <Link href="/intern/requests" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Gửi đơn mới
            </Link>
          </div>
          {myRequests?.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{req.type === 'leave' ? 'Nghỉ phép' : 'WFH'}</p>
                    <p className="text-xs text-slate-400">
                      {req.start_date} → {req.end_date}
                    </p>
                  </div>
                  <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileCheck2} text="Bạn chưa gửi đơn nào." />
          )}
        </section>
      </div>

      {/* Latest Evaluation Preview if available */}
      {latestEvaluation && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              Đánh giá gần nhất từ Mentor ({latestEvaluation.type_period === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'})
            </h2>
            <Link href="/intern/evaluations" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Xem bảng điểm chi tiết
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {Object.entries(latestEvaluation.scores_json ?? {}).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                <p className="text-xs text-slate-500 uppercase">{key}</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{String(value)}/10</p>
              </div>
            ))}
          </div>
          {latestEvaluation.feedback && (
            <p className="mt-3 text-xs italic text-slate-600 dark:text-slate-400 bg-slate-50/70 p-3 rounded-lg dark:bg-slate-800/40">
              &quot;{latestEvaluation.feedback}&quot;
            </p>
          )}
        </section>
      )}
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

function formatTime(val?: string | null) {
  return val ? new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}