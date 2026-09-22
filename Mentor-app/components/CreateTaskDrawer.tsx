'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { Avatar } from '@/components/mentor-app/avatar'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { createTasks } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

export interface InternOption {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

const CATEGORIES = ['Lập trình', 'Báo cáo', 'Nghiên cứu', 'Khác']

function todayIso(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function CreateTaskDrawer({
  open,
  onOpenChange,
  interns,
  initialSelected,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  interns?: InternOption[]
  initialSelected?: string[]
}) {
  const { toast } = useToast()
  const router = useRouter()

  const options = interns ?? []

  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [deadline, setDeadline] = useState('')
  const [pending, setPending] = useState(false)

  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setSelected(initialSelected ?? [])
      setTitle('')
      setCategory('')
      setDeadline('')
    }
  }

  const toggleIntern = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canSubmit = title.trim().length >= 3 && selected.length > 0 && !pending

  async function handleSubmit() {
    setPending(true)
    const res = await createTasks({
      title: title.trim(),
      category: category || undefined,
      deadline: deadline || undefined,
      assigneeIds: selected,
    })
    setPending(false)
    if (res.success) {
      toast('Đã giao việc thành công!')
      router.refresh()
      onOpenChange(false)
    } else {
      toast(res.error ?? 'Không thể giao việc', 'error')
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />

        <DrawerTitle className="pt-3 pb-2 text-center text-lg font-semibold tracking-tight">
          Giao việc nhanh
        </DrawerTitle>

        {/* Body */}
        <div
          data-vaul-no-drag
          className="flex-1 space-y-5 overflow-y-auto scrollbar-none px-4 py-2"
        >
          {/* Khối 1: Thực tập sinh */}
          <section className="space-y-2">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Thực tập sinh</p>
            {selected.length > 0 && (
              <p className="text-xs text-primary">
                Đã chọn {selected.length} người
              </p>
            )}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
              {options.length === 0 ? (
                <p className="w-full rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  Chưa có thực tập sinh nào trong danh sách của bạn.
                </p>
              ) : (
                options.map((intern) => {
                  const isSelected = selected.includes(intern.id)
                  return (
                    <button
                      key={intern.id}
                      type="button"
                      onClick={() => toggleIntern(intern.id)}
                      aria-pressed={isSelected}
                      aria-label={`Chọn ${intern.full_name}`}
                      className="flex w-16 shrink-0 snap-start flex-col items-center gap-1.5 transition-transform duration-150 active:scale-95"
                    >
                      <span
                        className={cn(
                          'overflow-hidden rounded-full transition-shadow duration-150',
                          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        )}
                      >
                        <Avatar src={intern.avatar_url} name={intern.full_name} size={48} />
                      </span>
                      <span
                        className={cn(
                          'w-full truncate text-center text-xs leading-tight',
                          isSelected ? 'font-medium text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {intern.full_name}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          {/* Khối 2: Tên công việc */}
          <section className="space-y-2">
            <label htmlFor="task-title" className="mb-2 block text-sm font-medium text-muted-foreground">
              Tên công việc
            </label>
            <Input
              id="task-title"
              placeholder="Nhập tên công việc..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="h-12 rounded-xl text-base"
            />
          </section>

          {/* Khối 3: Phân loại */}
          <section className="space-y-2">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Phân loại</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(isActive ? '' : cat)}
                    aria-pressed={isActive}
                    className={cn(
                      'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 active:scale-95',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Khối 4: Hạn chót */}
          <section className="space-y-2">
            <label htmlFor="task-deadline" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <CalendarBlank className="size-4" weight="bold" />
              Hạn chót
            </label>
            <input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={todayIso()}
              className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-base text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-colors tabular-nums"
            />
          </section>
        </div>

        {/* Footer */}
        <DrawerFooter className="mt-auto shrink-0 gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 w-full rounded-xl text-base font-medium transition-transform duration-150 active:scale-[0.98]"
          >
            {pending ? (
              <PaperPlaneTilt className="size-4 animate-pulse" weight="bold" />
            ) : (
              <PaperPlaneTilt className="size-4" weight="bold" />
            )}
            {pending ? 'Đang giao việc...' : selected.length > 0 ? `Giao việc (${selected.length})` : 'Giao việc'}
          </Button>
          {!canSubmit && (
            <p className="text-center text-xs text-muted-foreground">
              Nhập tên công việc tối thiểu 3 ký tự và chọn ít nhất 1 sinh viên
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}