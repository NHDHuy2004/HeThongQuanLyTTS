'use client'

import { useMemo, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/mentor-app/empty-state'
import { TaskList } from './task-list'
import type { TaskForReview } from './review-task-sheet'

export function TaskBoard({ tasks }: { tasks: TaskForReview[] }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return tasks
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q) ||
        (t.profiles?.full_name ?? '').toLowerCase().includes(q),
    )
  }, [tasks, q])

  const activeTasks = filtered.filter((t) =>
    ['pending_acceptance', 'in_progress', 'under_review'].includes(t.status),
  )
  const completedTasks = filtered.filter((t) => t.status === 'completed')
  const rejectedTasks = filtered.filter((t) => t.status === 'rejected')

  const isEmpty = filtered.length === 0

  return (
    <>
      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          weight="bold"
        />
        <Input
          placeholder="Tìm kiếm việc (tên, phân loại, sinh viên)..."
          aria-label="Tìm kiếm việc"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={ClipboardText}
          title="Không tìm thấy việc"
          description="Thử lại với từ khóa khác hoặc đặt lại bộ lọc."
        />
      ) : (
        <>
          {/* Active Tasks */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Đang thực hiện ({activeTasks.length})
            </h3>
            {activeTasks.length > 0 ? (
              <TaskList tasks={activeTasks} />
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Không có việc đang làm.
              </p>
            )}
          </div>

          {/* Rejected */}
          {rejectedTasks.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Trả lại ({rejectedTasks.length})
              </h3>
              <div className="space-y-2">
                {rejectedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-border bg-card p-3.5 opacity-80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium line-through">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {task.profiles?.full_name ?? 'N/A'}
                        </p>
                      </div>
                      <Badge variant="danger" className="text-[10px]">
                        Trả lại
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Đã hoàn thành ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-border bg-card p-3.5 opacity-70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium line-through">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {task.profiles?.full_name ?? 'N/A'}
                        </p>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        Xong
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}