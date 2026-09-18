import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { todayInVietnam } from '@/lib/format'
import { ReportCenter } from '@/components/mentor-app/report-center'
import type { ReportRow } from '@/components/mentor-app/report-review-drawer'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, report_interval_days, departments!profiles_department_id_fkey(name)')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internRows = interns ?? []
  const internIds = internRows.map((i) => i.id)

  let reports: ReportRow[] = []
  let attendance: {
    intern_id: string
    check_in_time: string | null
    check_out_time: string | null
    total_hours: number | null
    status: string
  }[] = []

  if (internIds.length > 0) {
    const [reportsResult, attendanceResult] = await Promise.all([
      supabase
        .from('periodic_reports')
        .select('id, status, period_number, due_date, attachment_url, content, submitted_at, created_at, profiles!periodic_reports_intern_id_fkey(full_name, avatar_url, report_interval_days)')
        .in('intern_id', internIds)
        .order('submitted_at', { ascending: false, nullsFirst: false }),
      supabase
        .from('attendance')
        .select('intern_id, check_in_time, check_out_time, total_hours, status')
        .eq('date', todayInVietnam())
        .in('intern_id', internIds)
        .order('check_in_time', { ascending: true }),
    ])

    reports = (reportsResult.data ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      period_number: r.period_number,
      due_date: r.due_date,
      attachment_url: r.attachment_url,
      content: r.content,
      submitted_at: r.submitted_at,
      created_at: r.created_at,
      report_interval_days: r.profiles?.report_interval_days ?? null,
      profiles: r.profiles ? { full_name: r.profiles.full_name, avatar_url: r.profiles.avatar_url } : null,
    }))

    attendance = (attendanceResult.data ?? []).map((a) => ({
      intern_id: a.intern_id,
      check_in_time: a.check_in_time,
      check_out_time: a.check_out_time,
      total_hours: a.total_hours,
      status: a.status,
    }))
  }

  return (
    <div className="flex flex-col pb-20">
      <ReportCenter
        userId={user.id}
        interns={internRows.map((i) => ({
          id: i.id,
          full_name: i.full_name,
          avatar_url: i.avatar_url,
          department: i.departments?.name ?? null,
        }))}
        reports={reports}
        attendanceToday={attendance}
      />
    </div>
  )
}