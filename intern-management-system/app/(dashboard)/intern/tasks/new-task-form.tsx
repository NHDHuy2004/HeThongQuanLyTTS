'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createTask } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

type Assignee = { id: string; full_name: string; role: string }
type TaskOption = { id: string; title: string }

const initialState: ActionResult = { success: false }

export function NewTaskForm({
  assignees,
  currentUserId,
  parentTasks = [],
  allowSelfAssign = false,
}: {
  assignees: Assignee[]
  currentUserId: string
  parentTasks?: TaskOption[]
  allowSelfAssign?: boolean
}) {
  const [state, formAction, pending] = useActionState(createTask, initialState)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast('Đã tạo công việc thành công!')
      formRef.current?.reset()
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  const defaultAssignee = allowSelfAssign ? currentUserId : assignees[0]?.id ?? currentUserId

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-lg border border-border bg-card p-5 shadow-card sm:grid-cols-2"
    >
      <Input name="title" placeholder="Tên công việc" required className="sm:col-span-2" />
      <Input name="description" placeholder="Mô tả ngắn (không bắt buộc)" className="sm:col-span-2" />

      <Input name="category" placeholder="Danh mục (vd: API, UI, Báo cáo)" />
      <Select name="priority" defaultValue="medium">
        <option value="low">Ưu tiên thấp</option>
        <option value="medium">Ưu tiên vừa</option>
        <option value="high">Ưu tiên cao</option>
      </Select>

      <Input name="deadline" type="datetime-local" />

      <Select name="parent_task_id" defaultValue="">
        <option value="">Không (công việc gốc)</option>
        {parentTasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title.length > 60 ? `${t.title.slice(0, 57)}...` : t.title}
          </option>
        ))}
      </Select>

      <Select name="assignee_id" defaultValue={defaultAssignee} className="sm:col-span-2">
        {allowSelfAssign && <option value={currentUserId}>Giao cho tôi</option>}
        {assignees
          .filter((a) => a.id !== currentUserId)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name} ({a.role})
            </option>
          ))}
      </Select>

      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? 'Đang tạo...' : 'Tạo công việc'}
      </Button>
    </form>
  )
}