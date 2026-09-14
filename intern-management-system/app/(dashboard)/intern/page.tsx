import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CalendarCheck } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { Star } from '@phosphor-icons/react/dist/ssr/Star'
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { daysBetween, formatTime, todayInVietnam, mondayOfVietnamWeek } from '@/lib/format'
import { AttendanceControls } from '@/components/interns/attendance-controls'
import { InternshipProgress } from '@/components/interns/internship-progress'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { EmptyState } from '@/components/page/empty-state'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { StatCard } from '@/components/page/stat-card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')
  if (profile.role !== 'intern') redirect(`/${profile.role}`)

  const today = new Date()
  const todayDateStr = todayInVietnam()
  const dateFormatted = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(today)

  // Today's attendance record
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('check_in_time, check_out_time, total_hours, status')
    .eq('intern_id', user.id)
    .eq('date', todayDateStr)
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
  const weekStart = mondayOfVietnamWeek(new Date())
  const { data: weekRecords } = await supabase
    .from('attendance')
    .select('total_hours')
    .eq('intern_id', user.id)
    .gte('date', weekStart)
  const weeklyHours = weekRecords?.reduce((sum: number, r: any) => sum + (r.total_hours ?? 0), 0) ?? 0

  // My open tasks
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, created_at, deadline')
    .eq('assignee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // My pending requests
  const { data: myRequests } = await supabase
    .from('leave_requests')
    .select('id, type, status, start_date, end_date, created_at')
    .eq('intern_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Latest evaluation
  const { data: latestEvaluation } = await supabase
    .from('evaluations')
    .select('id, type_period, scores_json, feedback, created_at')
    .eq('intern_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Periodic report deadline
  await supabase.rpc('ensure_periodic_reports', { p_intern_id: user.id })
  const { data: nextReport } = await supabase
    .from('periodic_reports')
    .select('period_number, due_date')
    .eq('intern_id', user.id)
    .in('status', ['pending', 'late'])
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const attendanceStatus = todayRecord?.check_out_time
    ? 'Đã hoàn tất ngày làm việc'
    : todayRecord?.check_in_time
    ? 'Đang làm việc'
    : 'Chưa check-in'

  const reportCountdown = nextReport?.due_date
    ? {
        periodNumber: nextReport.period_number,
        dueDate: nextReport.due_date,
        daysLeft: daysBetween(todayDateStr, nextReport.due_date),
      }
    : null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${dateFormatted} - Thực tập sinh`}
        title={`Xin chào, ${profile.full_name}`}
        description="Không gian làm việc, chấm công và theo dõi kết quả thực tập cá nhân."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <SectionCard className="md:col-span-2">
          <SectionHeader
            title="Điểm danh hôm nay"
            icon={CalendarCheck}
            action={<AttendanceControls canCheckIn={canCheckIn} canCheckOut={canCheckOut} />}
          />
          <div className="p-5">
            <p className="text-lg font-semibold tracking-tight">{attendanceStatus}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                Vào: <strong className="tabular-nums">{formatTime(todayRecord?.check_in_time)}</strong>
              </span>
              <span>
                Ra: <strong className="tabular-nums">{formatTime(todayRecord?.check_out_time)}</strong>
              </span>
              {todayRecord?.total_hours && (
                <span className="font-semibold text-success">
                  Tổng: <span className="tabular-nums">{todayRecord.total_hours}</span> giờ
                </span>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Mentor phụ trách" icon={UserCheck} />
          {mentorInfo ? (
            <div className="p-5">
              <p className="text-base font-semibold">{mentorInfo.full_name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{mentorInfo.email}</p>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-success">
                <CheckCircle className="size-3.5" weight="bold" /> Đã phân công chính thức
              </p>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm text-muted-foreground">Chưa được phân công</p>
              <p className="mt-1 text-xs text-warning-foreground">
                Vui lòng liên hệ Admin để được chỉ định người hướng dẫn.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2">
          <SectionHeader
            title="Tiến độ thực tập"
            icon={CalendarCheck}
            description={
              profile.start_date && profile.end_date
                ? `Kỳ thực tập từ ${profile.start_date} đến ${profile.end_date}, hạn nộp báo cáo mỗi ${profile.report_interval_days ?? '-'} ngày.`
                : 'Chưa được Admin thiết lập thời hạn thực tập.'
            }
            action={
              <Link href="/intern/reports" className="text-xs font-medium text-primary hover:underline">
                Xem báo cáo định kỳ
              </Link>
            }
          />
          <div className="p-5">
            <InternshipProgress startDate={profile.start_date} endDate={profile.end_date} />
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Đợt báo cáo kế tiếp" icon={Clock} />
          <div className="p-5">
            {reportCountdown ? (
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-bold tracking-tight">
                  Đợt <span className="tabular-nums">{reportCountdown.periodNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground">Hạn nộp {reportCountdown.dueDate}</p>
                <Badge
                  variant={reportCountdown.daysLeft < 0 ? 'danger' : reportCountdown.daysLeft <= 2 ? 'warning' : 'primary'}
                  className="mt-2 self-start"
                >
                  {reportCountdown.daysLeft < 0
                    ? 'Đã quá hạn nộp'
                    : reportCountdown.daysLeft === 0
                    ? 'Nộp báo cáo ngay hôm nay'
                    : `Còn ${reportCountdown.daysLeft} ngày để nộp`}
                </Badge>
              </div>
            ) : (
              <>
                <p className="text-base font-semibold">Đã nộp đủ các đợt</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Không còn đợt báo cáo nào đang chờ nộp trong lịch định kỳ.
                </p>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Giờ làm tuần này" value={`${weeklyHours.toFixed(1)}h`} icon={Clock} tone="success" />
        <StatCard label="Nhiệm vụ của bạn" value={myTasks?.length ?? 0} icon={ClipboardText} tone="primary" />
        <StatCard
          label="Đơn nghỉ đang duyệt"
          value={myRequests?.filter((r: any) => r.status === 'pending').length ?? 0}
          icon={CalendarBlank}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard>
          <SectionHeader
            title="Công việc của bạn"
            icon={ClipboardText}
            action={
              <Link href="/intern/tasks" className="text-xs font-medium text-primary hover:underline">
                Xem bảng công việc
              </Link>
            }
          />
          {myTasks?.length ? (
            <div className="divide-y divide-border">
              {myTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
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
            <EmptyState
              icon={ClipboardText}
              title="Bạn chưa có công việc nào"
              description="Công việc được Mentor giao sẽ xuất hiện ở đây."
            />
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader
            title="Đơn xin nghỉ phép và WFH của bạn"
            icon={CalendarBlank}
            action={
              <Link href="/intern/requests" className="text-xs font-medium text-primary hover:underline">
                Gửi đơn mới
              </Link>
            }
          />
          {myRequests?.length ? (
            <div className="divide-y divide-border">
              {myRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{req.type === 'leave' ? 'Nghỉ phép' : 'WFH'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {req.start_date} đến {req.end_date}
                    </p>
                  </div>
                  <Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarBlank}
              title="Bạn chưa gửi đơn nào"
              description="Các đơn xin nghỉ phép hoặc WFH của bạn sẽ xuất hiện ở đây."
            />
          )}
        </SectionCard>
      </div>

      {latestEvaluation && (
        <SectionCard>
          <SectionHeader
            title={`Đánh giá gần nhất ${latestEvaluation.type_period === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}`}
            icon={Star}
            action={
              <Link href="/intern/evaluations" className="text-xs font-medium text-primary hover:underline">
                Xem bảng điểm chi tiết
              </Link>
            }
          />
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {Object.entries(latestEvaluation.scores_json ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted p-2.5">
                  <p className="text-xs uppercase text-muted-foreground">{key}</p>
                  <p className="text-lg font-bold tabular-nums text-primary">{String(value)}/10</p>
                </div>
              ))}
            </div>
            {latestEvaluation.feedback && (
              <p className="mt-3 rounded-lg bg-muted p-3 text-xs italic leading-relaxed text-muted-foreground">
                &quot;{latestEvaluation.feedback}&quot;
              </p>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}


