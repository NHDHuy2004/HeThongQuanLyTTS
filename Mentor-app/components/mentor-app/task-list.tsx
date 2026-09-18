'use client'

import { useState } from 'react'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { ReviewTaskSheet, type TaskForReview } from './review-task-sheet'

export function TaskList({ tasks }: { tasks: TaskForReview[] }) {
  const [activeTask, setActiveTask] = useState<TaskForReview | null>(null)

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => {
          const actionable = task.status === 'under_review'
          const card = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {task.profiles?.full_name ?? 'N/A'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Badge variant={statusVariant(task.status)} className="text-[10px]">
                    {statusLabel(task.status)}
                  </Badge>
                </div>
              </div>
              {task.deadline && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                </p>
              )}
            </>
          )

          if (!actionable) {
            return (
              <div
                key={task.id}
                className="rounded-xl border border-border bg-card p-3.5 shadow-card"
              >
                {card}
              </div>
            )
          }

          return (
            <button
              key={task.id}
              onClick={() => setActiveTask(task)}
              className="flex w-full flex-col rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-colors active:scale-[0.99]"
            >
              {card}
            </button>
          )
        })}
      </div>

      <ReviewTaskSheet task={activeTask} onClose={() => setActiveTask(null)} />
    </>
  )
}