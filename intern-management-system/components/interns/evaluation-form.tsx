'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { createEvaluation } from '@/app/(dashboard)/intern/evaluations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

export function EvaluationForm({
  targetInterns,
}: {
  targetInterns: Array<{ id: string; full_name: string }>
}) {
  const [state, formAction, pending] = useActionState(createEvaluation, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã lưu kết quả đánh giá!')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  return (
    <form action={formAction} className="grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-xs font-semibold">
          Thực tập sinh <span className="text-destructive">*</span>
        </label>
        <Select name="intern_id" required>
          <option value="">-- Chọn thực tập sinh --</option>
          {targetInterns.map((intern) => (
            <option key={intern.id} value={intern.id}>
              {intern.full_name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold">
          Kỳ đánh giá <span className="text-destructive">*</span>
        </label>
        <Select name="type_period" defaultValue="midterm">
          <option value="midterm">Đánh giá Giữa kỳ</option>
          <option value="final">Đánh giá Cuối kỳ (Tổng kết)</option>
        </Select>
      </div>

      <div className="grid gap-3 rounded-lg bg-muted p-4 sm:col-span-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Kỹ thuật & Chuyên môn (0-10)
          </label>
          <Input
            name="technical"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="8.5"
            required
            className="h-9 bg-card"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Làm việc nhóm & Giao tiếp (0-10)
          </label>
          <Input
            name="teamwork"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="9.0"
            required
            className="h-9 bg-card"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Kỷ luật & Tác phong (0-10)
          </label>
          <Input
            name="discipline"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="9.5"
            required
            className="h-9 bg-card"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold">
          Nhận xét & Định hướng phát triển
        </label>
        <Textarea
          name="feedback"
          placeholder="Ghi nhận ưu điểm, những mặt cần cải thiện và lời khuyên dành cho sinh viên..."
        />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang lưu...' : 'Lưu kết quả đánh giá'}
        </Button>
      </div>
    </form>
  )
}