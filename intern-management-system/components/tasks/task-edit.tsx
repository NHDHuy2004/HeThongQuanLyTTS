'use client'

import { useCallback, useEffect, useState } from 'react'
import { useActionState } from 'react'
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { updateTask } from '@/app/(dashboard)/intern/tasks/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { toDateTimeLocal } from '@/lib/format'
import type { ActionResult } from '@/lib/action-utils'

type Assignee = { id: string; full_name: string; role: string }
type ParentTask = { id: string; title: string }
type Priority = 'low' | 'medium' | 'high'

const initialState: ActionResult = { success: false }

export function TaskEditSection({
  task,
  currentUserId,
  allowSelfAssign,
  assignees,
  parentTasks,
}: {
  task: {
    id: string
    title: string
    description: string | null
    category: string | null
    priority: Priority
    deadline: string | null
    assignee_id: string
    parent_task_id: string | null
  }
  currentUserId: string
  allowSelfAssign: boolean
  assignees: Assignee[]
  parentTasks: ParentTask[]
}) {
  const [open, setOpen] = useState(false)
  const handleSaved = useCallback(() => setOpen(false), [])

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        type="button"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <PencilSimple className="size-3.5" weight="bold" />
        Chỉnh sửa
      </Button>
    )
  }

  return (
    <TaskEditForm
      task={task}
      currentUserId={currentUserId}
      allowSelfAssign={allowSelfAssign}
      assignees={assignees}
      parentTasks={parentTasks}
      onCancel={handleSaved}
      onSaved={handleSaved}
    />
  )
}

function TaskEditForm({
  task,
  currentUserId,
  allowSelfAssign,
  assignees,
  parentTasks,
  onCancel,
  onSaved,
}: {
  task: {
    id: string
    title: string
    description: string | null
    category: string | null
    priority: Priority
    deadline: string | null
    assignee_id: string
    parent_task_id: string | null
  }
  currentUserId: string
  allowSelfAssign: boolean
  assignees: Assignee[]
  parentTasks: ParentTask[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [state, formAction, pending] = useActionState(updateTask, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã chỉnh sửa công việc!')
      onSaved()
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast, onSaved])

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="task_id" value={task.id} />

      <Input name="title" defaultValue={task.title} required className="h-9 text-sm" />
      <Textarea name="description" defaultValue={task.description ?? ''} rows={2} placeholder="Mô tả ngắn" />

      <div className="grid grid-cols-2 gap-2">
        <Input name="category" defaultValue={task.category ?? ''} placeholder="Danh mục" className="h-9 text-sm" />
        <Select name="priority" defaultValue={task.priority} className="h-9 text-sm">
          <option value="low">Ưu tiên thấp</option>
          <option value="medium">Ưu tiên vừa</option>
          <option value="high">Ưu tiên cao</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          name="deadline"
          type="datetime-local"
          defaultValue={toDateTimeLocal(task.deadline)}
          className="h-9 text-sm"
        />
        <Select
          name="parent_task_id"
          defaultValue={task.parent_task_id ?? ''}
          className="h-9 text-sm"
        >
          <option value="">Không (công việc gốc)</option>
          {parentTasks
            .filter((p) => p.id !== task.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.length > 40 ? `${p.title.slice(0, 37)}...` : p.title}
              </option>
            ))}
        </Select>
      </div>

      <Select name="assignee_id" defaultValue={task.assignee_id} className="h-9 text-sm">
        {allowSelfAssign && <option value={currentUserId}>Giao cho tôi</option>}
        {assignees
          .filter((a) => a.id !== currentUserId)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name} ({a.role})
            </option>
          ))}
      </Select>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
          Hủy
        </Button>
        <Button size="sm" type="submit" disabled={pending}>
          {pending ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>
    </form>
  )
}