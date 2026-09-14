'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { uploadDocument } from '@/app/(dashboard)/intern/documents/actions'
import { CloudArrowUp } from '@phosphor-icons/react/dist/ssr/CloudArrowUp'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

const initialState: ActionResult = { success: false }

export function DocumentUpload() {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã tải lên tài liệu!')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 border border-dashed border-border p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CloudArrowUp className="size-5" weight="bold" />
        </div>
        <div>
          <p className="text-sm font-semibold">Tải lên tệp tài liệu mới</p>
          <p className="text-xs text-muted-foreground">Định dạng hỗ trợ: PDF, Word (.doc, .docx). Tối đa 10MB.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="file"
          type="file"
          accept=".pdf,.doc,.docx"
          required
          className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Đang tải...' : 'Tải lên'}
        </Button>
      </div>
    </form>
  )
}