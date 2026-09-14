'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { submitFinalEvaluation } from '@/app/(dashboard)/mentor/final-evaluations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

const recommendationLabels = {
  pass: 'Đạt yêu cầu (Hoàn thành thực tập)',
  fail: 'Chưa đạt yêu cầu',
  offer_job: 'Đạt xuất sắc (Đề nghị tuyển dụng)',
} as const

export function FinalEvaluationForm({
  targetInterns,
}: {
  targetInterns: Array<{ id: string; full_name: string; evaluated: boolean }>
}) {
  const [state, formAction, pending] = useActionState(submitFinalEvaluation, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã lưu Đánh giá Tổng quan. Thực tập sinh đã được cập nhật trạng thái hoàn thành!')
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
              {intern.evaluated ? ' (Đã đánh giá) ' : ''}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold">
          Kết luận & Đề xuất <span className="text-destructive">*</span>
        </label>
        <Select name="recommendation" defaultValue="pass" required>
          {Object.entries(recommendationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Điểm tổng quan (0-10) hoặc để trống nếu dùng Xếp loại
        </label>
        <Input
          name="overall_score"
          type="number"
          min="0"
          max="10"
          step="0.5"
          placeholder="8.5"
          className="h-9 bg-card"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Xếp loại A/B/C/D (bắt buộc nếu chưa nhập Điểm tổng quan)
        </label>
        <Select name="grade" defaultValue="">
          <option value="">- Chưa xếp loại -</option>
          {['A', 'B', 'C', 'D'].map((g) => (
            <option key={g} value={g}>
              Loại {g}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Điểm Thái độ làm việc (0-10)
          </label>
          <Input
            name="work_attitude_score"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="9.0"
            className="h-9 bg-card"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Điểm Kỹ năng chuyên môn (0-10)
          </label>
          <Input
            name="skill_score"
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="8.0"
            className="h-9 bg-card"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold">
          Nhận xét tổng quan cuối kỳ
        </label>
        <Textarea
          name="general_feedback"
          placeholder="Tổng kết quá trình thực tập, ưu điểm, mặt cần cải thiện và định hướng cho Thực tập sinh..."
          maxLength={5000}
        />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="gap-1">
          <Medal className="size-4" weight="bold" />
          {pending ? 'Đang lưu...' : 'Lưu Đánh giá Tổng quan'}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Khi lưu, Thực tập sinh sẽ được cập nhật trạng thái Hoàn thành và mở khóa Giấy chứng nhận.
        </p>
      </div>
    </form>
  )
}