'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { createRequest } from '@/app/(dashboard)/intern/requests/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

type Mentor = { id: string; full_name: string }

const initialState: ActionResult = { success: false }

export function RequestForm({
  assignedMentorId,
  mentors,
}: {
  assignedMentorId: string | null
  mentors: Mentor[]
}) {
  const [state, formAction, pending] = useActionState(createRequest, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã gửi đơn phê duyệt!')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  const hasMentor = Boolean(assignedMentorId)

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-xs font-semibold">Loại yêu cầu</label>
        <Select name="type" defaultValue="leave">
          <option value="leave">Xin nghỉ phép</option>
          <option value="wfh">Làm việc từ xa (WFH)</option>
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold">Người duyệt (Mentor)</label>
        <Select name="mentor_id" defaultValue={assignedMentorId ?? ''} required disabled={!hasMentor}>
          <option value="">-- Chọn Mentor duyệt đơn --</option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.full_name}
              {mentor.id === assignedMentorId ? ' (Mentor được phân công)' : ''}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold">Ngày bắt đầu</label>
        <Input name="start_date" type="date" required />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold">Ngày kết thúc</label>
        <Input name="end_date" type="date" required />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold">Lý do cụ thể</label>
        <Textarea
          name="reason"
          required
          placeholder="Trình bày lý do xin nghỉ phép hoặc xin WFH..."
        />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={!hasMentor || pending}>
          {pending ? 'Đang gửi...' : 'Gửi đơn phê duyệt'}
        </Button>
      </div>
    </form>
  )
}