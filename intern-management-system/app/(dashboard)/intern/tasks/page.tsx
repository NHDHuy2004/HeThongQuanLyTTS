import { createClient } from '@/lib/supabase/server'
import { updateTaskStatus } from './actions'
import { NewTaskForm } from './new-task-form'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Calendar, User, CheckCircle2 } from 'lucide-react'

const columns = [
  { key: 'todo', label: 'Cần làm', color: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20' },
  { key: 'doing', label: 'Đang thực hiện', color: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20' },
  { key: 'done', label: 'Hoàn tất', color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20' },
] as const

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  const role = currentProfile?.role ?? 'intern'
  const isIntern = role === 'intern'
  const isMentor = role === 'mentor'
  const isAdmin = role === 'admin'

  // Fetch tasks according to role permissions
  let taskQuery = supabase
    .from('tasks')
    .select('id, title, description, priority, status, deadline, assignee_id, creator_id, profiles!tasks_assignee_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (isIntern) {
    taskQuery = taskQuery.eq('assignee_id', user.id)
  }

  const { data: tasks } = await taskQuery

  // Fetch assignees for task creation (only Admin and Mentor can create tasks)
  let assignees: Array<{ id: string; full_name: string; role: string }> = []
  if (isAdmin) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['intern', 'mentor'])
      .order('full_name')
    assignees = profiles ?? []
  } else if (isMentor) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('mentor_id', user.id)
      .eq('role', 'intern')
      .order('full_name')
    assignees = profiles ?? []
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {isAdmin && 'Quản trị hệ thống'}
            {isMentor && 'Bàn làm việc Mentor'}
            {isIntern && 'Không gian thực tập sinh'}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isIntern ? 'Nhiệm vụ được giao' : 'Quản lý công việc & Giao nhiệm vụ'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isIntern && 'Theo dõi danh sách và cập nhật tiến độ công việc do Mentor giao.'}
            {isMentor && 'Phân công nhiệm vụ và giám sát tiến độ thực hiện của nhóm thực tập sinh.'}
            {isAdmin && 'Giám sát toàn bộ công việc và nhiệm vụ trong toàn hệ thống.'}
          </p>
        </div>
      </div>

      {/* Task Creation Form: ONLY visible to Admin & Mentor */}
      {!isIntern && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Giao nhiệm vụ mới</h2>
            <span className="text-xs text-slate-500">{assignees.length} thực tập sinh có thể phân công</span>
          </div>
          <NewTaskForm assignees={assignees} currentUserId={user.id} />
        </section>
      )}

      {/* Kanban Board */}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks?.filter((t) => t.status === column.key) ?? []
          return (
            <section
              key={column.key}
              className={`flex flex-col min-h-64 rounded-xl border p-3.5 ${column.color}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span>{column.label}</span>
                </h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                      <Badge variant={statusVariant(task.priority)}>{statusLabel(task.priority)}</Badge>
                    </div>

                    {task.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-3">{task.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                      {!isIntern && (
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <User className="size-3 text-emerald-600" />
                          {(task as any).profiles?.full_name ?? 'Chưa rõ'}
                        </span>
                      )}
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <Calendar className="size-3" />
                          {new Date(task.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    {/* Status updater */}
                    <form action={updateTaskStatus} className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <input type="hidden" name="task_id" value={task.id} />
                      <div className="flex items-center gap-2">
                        <select
                          name="status"
                          defaultValue={task.status}
                          className="h-8 flex-1 rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"
                        >
                          <option value="todo">Cần làm</option>
                          <option value="doing">Đang thực hiện</option>
                          <option value="done">Hoàn tất</option>
                        </select>
                        <button
                          className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors shadow-xs"
                          type="submit"
                        >
                          <CheckCircle2 className="size-3" />
                          Lưu
                        </button>
                      </div>
                    </form>
                  </article>
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                    Không có công việc
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