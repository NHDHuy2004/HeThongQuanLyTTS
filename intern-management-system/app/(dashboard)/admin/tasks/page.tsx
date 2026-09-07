import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTaskStatus } from '@/app/(dashboard)/intern/tasks/actions'
import { NewTaskForm } from '@/app/(dashboard)/intern/tasks/new-task-form'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Calendar, User, CheckCircle2 } from 'lucide-react'

const columns = [
  { key: 'todo', label: 'Cần làm', color: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20' },
  { key: 'doing', label: 'Đang thực hiện', color: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20' },
  { key: 'done', label: 'Hoàn tất', color: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20' },
] as const

export default async function AdminTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect(`/${currentProfile?.role ?? 'login'}`)

  // Admin gets all tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, priority, status, deadline, assignee_id, creator_id, profiles!tasks_assignee_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  // Admin can assign to all interns & mentors
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['intern', 'mentor'])
    .order('full_name')

  const assignees = profiles ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Quản trị hệ thống</p>
          <h1 className="text-2xl font-semibold tracking-tight">Giám sát công việc toàn trường</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi, điều phối và phân công nhiệm vụ cho toàn bộ thực tập sinh và mentor.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Giao nhiệm vụ mới</h2>
          <span className="text-xs text-slate-500">{assignees.length} thành viên có thể phân công</span>
        </div>
        <NewTaskForm assignees={assignees} currentUserId={user.id} />
      </section>

      {/* Kanban */}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks?.filter((t) => t.status === column.key) ?? []
          return (
            <section
              key={column.key}
              className={`flex flex-col min-h-64 rounded-xl border p-3.5 ${column.color}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</h3>
                      <Badge variant={statusVariant(task.priority)}>{statusLabel(task.priority)}</Badge>
                    </div>

                    {task.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-3">{task.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <User className="size-3 text-emerald-600" />
                        {(task as any).profiles?.full_name ?? 'Chưa rõ'}
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <Calendar className="size-3" />
                          {new Date(task.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

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
