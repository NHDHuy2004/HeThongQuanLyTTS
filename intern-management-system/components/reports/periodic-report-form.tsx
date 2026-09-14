'use client'

import { useEffect, useRef, useState } from 'react'
import { useActionState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { UploadSimple } from '@phosphor-icons/react/dist/ssr/UploadSimple'
import { submitPeriodicReport } from '@/app/(dashboard)/intern/reports/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

type TaskOption = { id: string; title: string }

export function PeriodicReportForm({
  report,
  tasks,
  internId,
}: {
  report: { id: string; periodNumber: number; dueDate: string }
  tasks: TaskOption[]
  internId: string
}) {
  const [state, formAction, pending] = useActionState(submitPeriodicReport, initialState)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (state.success) {
      toast('Đã nộp báo cáo định kỳ thành công!')
      formRef.current?.reset()
      queueMicrotask(() => setFileName(null))
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const file = fileRef.current?.files?.[0]

    if (file) {
      setUploading(true)
      const supabase = createClient()
      const path = `${internId}/reports/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('documents').upload(path, file)
      setUploading(false)

      if (error) {
        toast('Không thể tải tệp đính kèm. Vui lòng thử lại.', 'error')
        return
      }
      formData.set('attachment_url', path)
    }

    formAction(formData)
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-border bg-card p-5 shadow-card"
    >
      <input type="hidden" name="report_id" value={report.id} />

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-medium tabular-nums text-primary">
          Đợt {report.periodNumber}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarBlank className="size-3.5" weight="bold" />
          Hạn nộp {report.dueDate}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select name="task_id" defaultValue="">
          <option value="">Công việc liên quan (không bắt buộc)</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title.length > 60 ? `${t.title.slice(0, 57)}...` : t.title}
            </option>
          ))}
        </Select>
        <Input value={`Khoảng thời gian ${tasks.length > 0 ? 'thực tập' : 'làm việc'}`} readOnly disabled />
      </div>

      <Textarea
        name="content"
        placeholder="Mô tả tiến độ trong đợt này, khó khăn gặp phải và kế hoạch cho đợt tới..."
        required
        minLength={1}
        maxLength={10000}
        className="min-h-40"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/70">
          <UploadSimple className="size-4 text-primary" weight="bold" />
          {fileName ?? 'Đính kèm tệp (không bắt buộc)'}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {fileName && (
          <button
            type="button"
            className="text-xs font-medium text-destructive hover:underline"
            onClick={() => {
              fileRef.current!.value = ''
              setFileName(null)
            }}
          >
            Bỏ tệp
          </button>
        )}
      </div>

      <Button type="submit" disabled={pending || uploading} className="self-start gap-1">
        {uploading ? (
          'Đang tải tệp...'
        ) : pending ? (
          'Đang nộp...'
        ) : (
          <>
            <PaperPlaneTilt className="size-4" weight="bold" />
            Nộp báo cáo đợt {report.periodNumber}
          </>
        )}
      </Button>
    </form>
  )
}