import { createTask } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Assignee = { id: string; full_name: string; role: string }

export function NewTaskForm({ assignees, currentUserId }: { assignees: Assignee[]; currentUserId: string }) {
  const defaultAssignee = assignees[0]?.id ?? currentUserId
  return <form action={createTask} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"><Input name="title" placeholder="Tên công việc" required className="sm:col-span-2" /><Input name="description" placeholder="Mô tả ngắn (không bắt buộc)" className="sm:col-span-2" /><select name="priority" defaultValue="medium" className="border-input bg-background h-9 rounded-md border px-3 text-sm"><option value="low">Ưu tiên thấp</option><option value="medium">Ưu tiên vừa</option><option value="high">Ưu tiên cao</option></select><Input name="deadline" type="datetime-local" /><select name="assignee_id" defaultValue={defaultAssignee} className="border-input bg-background h-9 rounded-md border px-3 text-sm"><option value={currentUserId}>Giao cho tôi</option>{assignees.filter((assignee) => assignee.id !== currentUserId).map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.full_name} ({assignee.role})</option>)}</select><Button type="submit">Tạo công việc</Button></form>
}