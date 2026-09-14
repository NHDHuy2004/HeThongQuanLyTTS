import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { NewTaskForm } from '@/app/(dashboard)/intern/tasks/new-task-form'
import { TaskTree, type TaskRow } from '@/components/tasks/task-tree'
import { PageHeader } from '@/components/page/page-header'
import { statusLabel } from '@/components/ui/badge'

const columns = [
  { key: 'pending_acceptance', label: 'Chờ xác nhận' },
  { key: 'in_progress', label: 'Đang thực hiện' },
  { key: 'under_review', label: 'Chờ duyệt' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'rejected', label: 'Từ chối' },
] as const

const TASK_SELECT =
  'id, title, description, category, priority, status, completion_status, deadline, submission_url, feedback, accepted_at, submitted_at, completed_at, assignee_id, creator_id, parent_task_id, profiles!tasks_assignee_id_fkey(full_name), creators:profiles!tasks_creator_id_fkey(full_name)'

export async function TasksView() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const role = profile.role
  const isIntern = role === 'intern'
  const isMentor = role === 'mentor'
  const isAdmin = role === 'admin'

  let taskQuery = supabase
    .from('tasks')
    .select(TASK_SELECT)
    .order('created_at', { ascending: false })

  if (isIntern) {
    taskQuery = taskQuery.eq('assignee_id', user.id)
  }

  const { data: rawTasks } = await taskQuery
  const tasks = (rawTasks ?? []) as unknown as TaskRow[]

  let assignees: Array<{ id: string; full_name: string; role: string }> = []
  let parentTasks: Array<{ id: string; title: string }> = []

  if (isAdmin) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['intern', 'mentor'])
      .order('full_name')
    assignees = profiles ?? []

    const { data: parents } = await supabase
      .from('tasks')
      .select('id, title')
      .is('parent_task_id', null)
      .order('created_at', { ascending: false })
    parentTasks = parents ?? []
  } else if (isMentor) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('mentor_id', user.id)
      .eq('role', 'intern')
      .order('full_name')
    assignees = profiles ?? []

    const { data: parents } = await supabase
      .from('tasks')
      .select('id, title')
      .is('parent_task_id', null)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
    parentTasks = parents ?? []
  }

  const pageCopy = {
    internalLabel: isAdmin
      ? 'Quản trị hệ thống'
      : isMentor
        ? 'Bàn làm việc Mentor'
        : 'Không gian thực tập sinh',
    title: isIntern
      ? 'Nhiệm vụ được giao'
      : 'Quản lý công việc và giao nhiệm vụ',
    description: isIntern
      ? 'Xác nhận, cập nhật tiến độ và nộp kết quả công việc do Mentor giao. Công việc duyệt đúng hạn sẽ có huy hiệu xanh Đúng hạn.'
      : isMentor
        ? 'Phân công nhiệm vụ, duyệt kết quả và giám sát tiến độ thực hiện của nhóm thực tập sinh.'
        : 'Giám sát toàn bộ công việc và nhiệm vụ trong toàn hệ thống.',
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={pageCopy.internalLabel}
        title={pageCopy.title}
        description={pageCopy.description}
      />

      {!isIntern && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Giao nhiệm vụ mới</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {assignees.length} thực tập sinh có thể phân công
            </span>
          </div>
          <NewTaskForm
            assignees={assignees}
            currentUserId={user.id}
            parentTasks={parentTasks}
            allowSelfAssign={isAdmin}
          />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.key)
          return (
            <section key={column.key} className="flex min-h-64 flex-col rounded-lg border border-border bg-accent/40 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">{column.label}</h2>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <TaskTree
                  tasks={columnTasks}
                  showAssignee={!isIntern}
                  canEdit={!isIntern}
                  isIntern={isIntern}
                  currentUserId={user.id}
                  allowSelfAssign={isAdmin}
                  assignees={assignees}
                  parentTasks={parentTasks}
                />

                {columnTasks.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    {virtualStatusHint(column.key, isIntern)}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function virtualStatusHint(columnKey: (typeof columns)[number]['key'], isIntern: boolean): string {
  if (isIntern) {
    if (columnKey === 'pending_acceptance') return 'Chưa có công việc chờ xác nhận'
    if (columnKey === 'under_review') return 'Chưa có bài nộp chờ duyệt'
  }
  if (columnKey === 'pending_acceptance') return 'Không có công việc chờ xác nhận'
  if (columnKey === 'under_review') return 'Chưa có công việc chờ duyệt'
  return `Không có công việc ${statusLabel(columnKey).toLowerCase()}`
}