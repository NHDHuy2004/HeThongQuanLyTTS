import { createClient } from '@/lib/supabase/server'
import { updateTaskStatus } from './actions'
import { NewTaskForm } from './new-task-form'

const columns = [{ key: 'todo', label: 'Cần làm' }, { key: 'doing', label: 'Đang thực hiện' }, { key: 'done', label: 'Hoàn tất' }] as const

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: tasks } = await supabase.from('tasks').select('id,title,description,priority,status,deadline,assignee_id').order('created_at', { ascending: false })
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: profiles } = await supabase.from('profiles').select('id,full_name,role,mentor_id').in('role', ['intern', 'mentor'])
  const assignees = profiles?.filter((profile) => currentProfile?.role === 'admin' || profile.mentor_id === user.id || profile.id === user.id) ?? []

  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Không gian làm việc</p><h1 className="text-2xl font-semibold tracking-tight">Công việc</h1><p className="mt-1 text-sm text-slate-500">Theo dõi tiến độ và phân công nhiệm vụ.</p></div></div><NewTaskForm assignees={assignees} currentUserId={user.id} /><div className="grid gap-4 lg:grid-cols-3">{columns.map((column) => <section key={column.key} className="min-h-52 rounded-xl bg-slate-100/80 p-3 dark:bg-slate-900/70"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{column.label}</h2><span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{tasks?.filter((task) => task.status === column.key).length ?? 0}</span></div><div className="space-y-3">{tasks?.filter((task) => task.status === column.key).map((task) => <article key={task.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-medium">{task.title}</h3><span className="text-[11px] uppercase text-slate-400">{task.priority}</span></div>{task.description && <p className="mt-2 text-xs text-slate-500">{task.description}</p>}<form action={updateTaskStatus} className="mt-4"><input type="hidden" name="task_id" value={task.id} /><select name="status" defaultValue={task.status} className="h-8 w-full rounded-md border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"><option value="todo">Cần làm</option><option value="doing">Đang thực hiện</option><option value="done">Hoàn tất</option></select><ButtonLabel /></form></article>)}</div></section>)}</div><p className="text-xs text-slate-500">{assignees.length} hồ sơ có thể được phân công.</p></div>
}

function ButtonLabel() {
  return <button className="mt-2 w-full rounded-md bg-emerald-700 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors shadow-xs" type="submit">Lưu trạng thái</button>
}