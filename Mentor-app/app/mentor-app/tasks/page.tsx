import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { TasksRealtime } from '@/components/mentor-app/tasks-realtime'
import { TaskBoard } from '@/components/mentor-app/task-board'
import type { TaskForReview } from '@/components/mentor-app/review-task-sheet'

export default async function TasksPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')

  const internIds = interns?.map((i) => i.id) ?? []

  let tasks: TaskForReview[] = []
  if (internIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select(
        'id, title, status, priority, deadline, category, created_at, description, submission_url, submitted_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url)',
      )
      .in('assignee_id', internIds)
      .order('created_at', { ascending: false })
      .limit(50)
    tasks = (data ?? []) as TaskForReview[]
  }

  return (
    <div className="space-y-4">
      <TasksRealtime internIds={internIds} />
      <TaskBoard tasks={tasks} />
    </div>
  )
}