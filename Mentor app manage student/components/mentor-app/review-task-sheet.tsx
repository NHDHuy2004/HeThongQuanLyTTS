'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { Folders } from '@phosphor-icons/react/dist/ssr/Folders'
import { Tag } from '@phosphor-icons/react/dist/ssr/Tag'
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle'
import { BottomSheet } from './bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Avatar } from './avatar'
import { useToast } from '@/components/ui/toast'
import { reviewTaskSubmission } from '@/lib/actions/tasks'
import { formatRelativeTime } from '@/lib/format'

export interface TaskForReview {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: 'low' | 'medium' | 'high'
  status: string
  deadline: string | null
  submission_url: string | null
  submitted_at: string | null
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

function formatDeadline(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ReviewTaskSheet({
  task,
  onClose,
}: {
  task: TaskForReview | null
  onClose: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState('')
  const [pending, setPending] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)

  const showSubmitUrl = task?.submission_url && task.submission_url.trim().length > 0

  async function handleReview(decision: 'approved' | 'rejected') {
    if (!task) return
    setPending(true)
    const res = await reviewTaskSubmission({
      task_id: task.id,
      decision,
      feedback: feedback.trim() || undefined,
    })
    setPending(false)
    if (res.success) {
      toast(decision === 'approved' ? 'Da duyet bai nop!' : 'Da tra bai kem nhan xet.')
      router.refresh()
      onClose()
    } else {
      toast(res.error ?? 'Khong the duyet bai nop.', 'error')
    }
  }

  return (
    <BottomSheet open={task !== null} onClose={onClose} title="Duyet bai nop">
      {task && (
        <div className="p-4">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">{task.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={statusVariant(task.priority)} className="text-[10px]">
                  {statusLabel(task.priority)}
                </Badge>
                <Badge variant={task.category ? 'primary' : 'default'} className="text-[10px]">
                  {task.category ?? 'Khong co danh muc'}
                </Badge>
              </div>
            </div>
            <Badge variant={statusVariant(task.status)} className="shrink-0 text-[10px]">
              {statusLabel(task.status)}
            </Badge>
          </div>

          {/* Intern */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <Avatar src={task.profiles?.avatar_url} name={task.profiles?.full_name ?? '?'} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{task.profiles?.full_name ?? 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                Nop {task.submitted_at ? formatRelativeTime(task.submitted_at) : ''}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4 space-y-2">
            {task.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarBlank className="size-4 shrink-0 text-muted-foreground" weight="bold" />
                <span className="text-muted-foreground">Han chot:</span>
                <span className="font-medium tabular-nums">{formatDeadline(task.deadline)}</span>
              </div>
            )}
            {showSubmitUrl && (
              <a
                href={task.submission_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <ArrowSquareOut className="size-4 shrink-0" weight="bold" />
                <span className="min-w-0 flex-1 truncate">{task.submission_url}</span>
              </a>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Tag className="size-3.5" weight="bold" /> Mo ta
              </p>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Feedback */}
          <div className="mt-4">
            <div className="mb-1 flex items-center gap-1.5">
              <Folders className="size-3.5 text-muted-foreground" weight="bold" />
              <p className="text-xs font-semibold text-muted-foreground">Nhan xet cua ban</p>
              <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{feedback.length}/2000</span>
            </div>
            <Textarea
              placeholder="Gop y cho bai nop nay..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={2000}
              rows={3}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Bat buoc nhap nhan xet khi tu choi bai.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              onClick={() => handleReview('approved')}
              disabled={pending}
              className="h-12 w-full gap-2 text-base"
            >
              <CheckCircle className="size-5" weight="bold" />
              {pending ? 'Dang xu ly...' : 'Duyet bai'}
            </Button>
            <Button
              onClick={() => {
                if (!confirmReject) {
                  setConfirmReject(true)
                  return
                }
                void handleReview('rejected')
              }}
              variant="outline"
              disabled={pending || feedback.trim().length < 3}
              className="h-12 w-full gap-2 border-destructive/40 text-base text-destructive hover:bg-destructive/10"
            >
              <XCircle className="size-5" weight="bold" />
              {pending ? 'Dang xu ly...' : confirmReject ? 'Xac nhan tra bai?' : 'Tra bai kem nhan xet'}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}