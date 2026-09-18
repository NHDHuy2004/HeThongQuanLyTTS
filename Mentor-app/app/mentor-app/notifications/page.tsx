import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { NotificationsRealtime } from '@/components/mentor-app/notifications-realtime'
import {
  NotificationFeed,
} from '@/components/mentor-app/notification-feed'
import type { LeaveRequestDetail } from '@/components/mentor-app/review-request-sheet'
import type { TaskForReview } from '@/components/mentor-app/review-task-sheet'
import type { ReportForReview } from '@/components/mentor-app/review-report-sheet'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  // Fetch recent leave requests
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('id, type, status, reason, start_date, end_date, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const requestRows = (requests ?? []) as LeaveRequestDetail[]

  // Fetch recent task submissions
  const { data: interns } = await supabase
    .from('profiles')
    .select('id')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')

  const internIds = interns?.map((i) => i.id) ?? []

  let taskRows: TaskForReview[] = []
  let reportRows: ReportForReview[] = []
  if (internIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, deadline, category, description, submission_url, submitted_at, created_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url)')
      .in('assignee_id', internIds)
      .eq('status', 'under_review')
      .order('submitted_at', { ascending: false })
      .limit(10)
    taskRows = (tasks ?? []) as TaskForReview[]

    const { data: reports } = await supabase
      .from('periodic_reports')
      .select('id, status, period_number, due_date, attachment_url, content, submitted_at, created_at, profiles!periodic_reports_intern_id_fkey(full_name, avatar_url)')
      .in('intern_id', internIds)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(10)
    reportRows = (reports ?? []) as ReportForReview[]
  }

  return (
    <div className="space-y-4">
      <NotificationsRealtime userId={user.id} internIds={internIds} />
      <NotificationFeed requests={requestRows} tasks={taskRows} reports={reportRows} />
    </div>
  )
}