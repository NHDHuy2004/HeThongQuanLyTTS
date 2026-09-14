'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from '@phosphor-icons/react/dist/ssr/Check'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomSheet } from './bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createTasks } from '@/lib/actions/tasks'
import type { Database } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

type TaskPriority = Database['public']['Enums']['task_priority']

export interface InternOption {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

const CATEGORIES = ['Bug', 'Feature', 'UI', 'Bao cao', 'Kiem thu', 'Khac']

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Thap' },
  { value: 'medium', label: 'Vua' },
  { value: 'high', label: 'Cao' },
]

export function CreateTaskSheet({
  open,
  onClose,
  interns,
}: {
  open: boolean
  onClose: () => void
  interns: InternOption[]
}) {
  const { toast } = useToast()
  const router = useRouter()

  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [deadline, setDeadline] = useState('')
  const [pending, setPending] = useState(false)

  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setSelected([])
      setSearch('')
      setTitle('')
      setDescription('')
      setCategory('')
      setCustomCategory('')
      setPriority('medium')
      setDeadline('')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return interns
    return interns.filter((i) => i.full_name.toLowerCase().includes(q))
  }, [interns, search])

  const toggleIntern = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const effectiveCategory = category === 'Khac' ? customCategory.trim() : category
  const canSubmit = title.trim().length >= 3 && selected.length > 0 && !pending

  async function handleSubmit() {
    setPending(true)
    const res = await createTasks({
      title: title.trim(),
      description: description.trim() || undefined,
      category: effectiveCategory || undefined,
      priority,
      deadline: deadline || undefined,
      assigneeIds: selected,
    })
    setPending(false)
    if (res.success) {
      toast('Da giao viec thanh cong!')
      router.refresh()
      onClose()
    } else {
      toast(res.error ?? 'Khong the giao viec', 'error')
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Giao viec nhanh">
      <div className="p-4">
        {/* Intern multi-select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Chon sinh vien <span className="text-primary">({selected.length})</span>
            </p>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Bo chon tat ca
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => {
                const intern = interns.find((i) => i.id === id)
                if (!intern) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {intern.full_name}
                    <button onClick={() => toggleIntern(id)} aria-label={`Bo chon ${intern.full_name}`}>
                      <X className="size-3" weight="bold" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" weight="bold" />
            <Input
              placeholder="Tim sinh vien..."
              aria-label="Tim sinh vien"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-52 space-y-1 overflow-y-auto scrollbar-none rounded-lg border border-border">
            {filtered.length > 0 ? (
              filtered.map((intern) => {
                const isSelected = selected.includes(intern.id)
                return (
                  <button
                    key={intern.id}
                    onClick={() => toggleIntern(intern.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                    >
                      {isSelected && <Check className="size-3" weight="bold" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{intern.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{intern.email}</span>
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Khong tim thay sinh vien nao
              </p>
            )}
          </div>
        </div>

        <div className="my-4 border-t border-border" />

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="task-title" className="text-sm font-semibold">
            Tieu de cong viec
          </label>
          <Input
            id="task-title"
            placeholder="Vi du: Xay dung giao dien trang chu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Category chips */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">Danh muc</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? '' : cat)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  category === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {category === 'Khac' && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Nhap danh muc tu dinh nghia"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength={100}
                  className="mt-2"
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Priority */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">Muc do uu tien</p>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  priority === p.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div className="mt-4 space-y-2">
          <label htmlFor="task-deadline" className="text-sm font-semibold">
            Han chot
          </label>
          <Input
            id="task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="tabular-nums"
          />
          <p className="text-xs text-muted-foreground">De trong neu chua co han chot</p>
        </div>

        {/* Description */}
        <div className="mt-4 space-y-2">
          <label htmlFor="task-description" className="text-sm font-semibold">
            Mo ta <span className="font-normal text-muted-foreground">(khong bat buoc)</span>
          </label>
          <Textarea
            id="task-description"
            placeholder="Mo ta chi tiet cong viec..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={handleSubmit} disabled={!canSubmit} className="h-12 w-full text-base">
            {pending ? (
              <span className="flex items-center gap-2">
                <Plus className="size-4 animate-spin" weight="bold" /> Dang giao viec...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="size-4" weight="bold" />
                Giao viec cho {selected.length} sinh vien
              </span>
            )}
          </Button>
          {!canSubmit && (
            <p className="text-center text-xs text-muted-foreground">
              Nhap tieu de toi thieu 3 ky tu va chon it nhat 1 sinh vien
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}