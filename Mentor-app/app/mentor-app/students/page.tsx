import { redirect } from 'next/navigation'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { StudentDirectory } from '@/components/mentor-app/student-directory'
import type { InternRow } from '@/components/mentor-app/intern-detail-drawer'
import { EmptyState } from '@/components/mentor-app/empty-state'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, email, university, major, avatar_url, start_date, end_date, internship_status, department_id, departments!profiles_department_id_fkey(name)')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const rows = interns ?? []
  const internIds = rows.map((i) => i.id)
  const nowIso = new Date().toISOString()

  let tasksByIntern = new Map<string, { total: number; completed: number; overdue: number }>()
  let reportsByIntern = new Map<string, InternRow['reports']>()

  if (internIds.length > 0) {
    const [tasksResult, reportsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('assignee_id, status, deadline')
        .in('assignee_id', internIds),
      supabase
        .from('periodic_reports')
        .select('intern_id, period_number, status, submitted_at')
        .in('intern_id', internIds)
        .order('created_at', { ascending: false }),
    ])

    const counts = new Map<string, { total: number; completed: number; overdue: number }>()
    for (const task of tasksResult.data ?? []) {
      const entry = counts.get(task.assignee_id) ?? { total: 0, completed: 0, overdue: 0 }
      entry.total += 1
      if (task.status === 'completed') entry.completed += 1
      if (
        (task.status === 'pending_acceptance' || task.status === 'in_progress') &&
        task.deadline &&
        new Date(task.deadline).getTime() < Date.parse(nowIso)
      ) {
        entry.overdue += 1
      }
      counts.set(task.assignee_id, entry)
    }
    tasksByIntern = counts

    const byIntern = new Map<string, InternRow['reports']>()
    for (const report of reportsResult.data ?? []) {
      const list = byIntern.get(report.intern_id) ?? []
      if (list.length < 50) {
        list.push({
          period_number: report.period_number,
          status: report.status,
          submitted_at: report.submitted_at,
        })
      }
      byIntern.set(report.intern_id, list)
    }
    reportsByIntern = byIntern
  }

  const internList: InternRow[] = rows.map((intern) => {
    const tasks = tasksByIntern.get(intern.id) ?? { total: 0, completed: 0, overdue: 0 }
    return {
      id: intern.id,
      full_name: intern.full_name,
      email: intern.email,
      avatar_url: intern.avatar_url,
      university: intern.university,
      major: intern.major,
      start_date: intern.start_date,
      end_date: intern.end_date,
      internship_status: intern.internship_status,
      department: intern.departments?.name ?? null,
      task_total: tasks.total,
      task_completed: tasks.completed,
      overdue_count: tasks.overdue,
      reports: reportsByIntern.get(intern.id) ?? [],
    }
  })

  return (
    <div className="flex flex-col pb-20">
      {internList.length > 0 ? (
        <StudentDirectory interns={internList} />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Chưa có sinh viên"
          description="Sinh viên được phân công cho bạn sẽ hiển thị tại đây."
        />
      )}
    </div>
  )
}