import { createTask } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewTaskForm({ assigneeId }: { assigneeId: string }) {
  return <form action={createTask} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"><Input name="title" placeholder="Tên công việc" required className="sm:col-span-2" /><Input name="description" placeholder="Mô tả ngắn (không bắt buộc)" className="sm:col-span-2" /><select name="priority" defaultValue="medium" className="border-input bg-background h-9 rounded-md border px-3 text-sm"><option value="low">Ưu tiên thấp</option><option value="medium">Ưu tiên vừa</option><option value="high">Ưu tiên cao</option></select><Input name="deadline" type="datetime-local" /><input type="hidden" name="assignee_id" value={assigneeId} /><Button type="submit">Tạo công việc</Button></form>
}