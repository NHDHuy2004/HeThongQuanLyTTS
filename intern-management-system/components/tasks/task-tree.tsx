import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr/ArrowClockwise'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { GitBranch } from '@phosphor-icons/react/dist/ssr/GitBranch'
import { Handshake } from '@phosphor-icons/react/dist/ssr/Handshake'
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit'
import { Rocket } from '@phosphor-icons/react/dist/ssr/Rocket'
import { User } from '@phosphor-icons/react/dist/ssr/User'
import { UserCircle } from '@phosphor-icons/react/dist/ssr/UserCircle'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateTaskStatus } from '@/app/(dashboard)/intern/tasks/actions'
import { TaskEditSection } from '@/components/tasks/task-edit'

export type TaskStatus = 'pending_acceptance' | 'in_progress' | 'under_review' | 'completed' | 'rejected'

export type TaskRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: 'low' | 'medium' | 'high'
  status: TaskStatus
  completion_status: 'on_time' | 'late' | null
  deadline: string | null
  submission_url: string | null
  feedback: string | null
  accepted_at: string | null
  submitted_at: string | null
  completed_at: string | null
  assignee_id: string
  creator_id: string
  parent_task_id: string | null
  profiles?: { full_name: string } | { full_name: string }[] | null
  creators?: { full_name: string } | { full_name: string }[] | null
}

type Assignee = { id: string; full_name: string; role: string }
type ParentTask = { id: string; title: string }

function assigneeName(task: TaskRow): string | null {
  const p = task.profiles
  if (!p) return null
  const names = Array.isArray(p) ? p.map((x) => x.full_name) : [p.full_name]
  return names[0] ?? null
}

function creatorName(task: TaskRow): string | null {
  const c = task.creators
  if (!c) return null
  const names = Array.isArray(c) ? c.map((x) => x.full_name) : [c.full_name]
  return names[0] ?? null
}

function compactDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN')
}

function InternActions({ task }: { task: TaskRow }) {
  if (task.status === 'pending_acceptance') {
    return (
      <form action={(formData) => { void updateTaskStatus(formData) }} className="mt-3 border-t border-border pt-3">
        <input type="hidden" name="task_id" value={task.id} />
        <input type="hidden" name="status" value="in_progress" />
        <Button size="sm" className="gap-1">
          <Handshake className="size-3.5" weight="bold" />
          Xác nhận nhận task
        </Button>
      </form>
    )
  }

  if (task.status === 'in_progress') {
    return (
      <form action={(formData) => { void updateTaskStatus(formData) }} className="mt-3 space-y-2 border-t border-border pt-3">
        <input type="hidden" name="task_id" value={task.id} />
        <input type="hidden" name="status" value="under_review" />
        <Input name="submission_url" placeholder="Liên kết kết quả/bài làm (URL)" className="h-8 text-xs" />
        <Button size="sm" className="gap-1">
          <PaperPlaneTilt className="size-3.5" weight="bold" />
          Nộp bài
        </Button>
      </form>
    )
  }

  return null
}

function ReviewActions({ task }: { task: TaskRow }) {
  if (task.status !== 'under_review') return null

  return (
    <form action={(formData) => { void updateTaskStatus(formData) }} className="mt-3 space-y-2 border-t border-border pt-3">
      <input type="hidden" name="task_id" value={task.id} />
      <Input
        name="feedback"
        placeholder="Nhận xét / phản hồi (bắt buộc khi yêu cầu làm lại hoặc từ chối)"
        className="h-8 text-xs"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" name="status" value="completed" type="submit" className="gap-1">
          <CheckCircle className="size-3.5" weight="bold" />
          Duyệt hoàn thành
        </Button>
        <Button size="sm" name="status" value="in_progress" type="submit" variant="outline" className="gap-1">
          <ArrowClockwise className="size-3.5" weight="bold" />
          Yêu cầu làm lại
        </Button>
        <Button size="sm" name="status" value="rejected" type="submit" variant="ghost" className="gap-1 text-destructive hover:bg-destructive/10">
          <Prohibit className="size-3.5" weight="bold" />
          Từ chối
        </Button>
      </div>
    </form>
  )
}

function TaskCard({
  task,
  depth,
  showAssignee,
  canEdit,
  isIntern,
  currentUserId,
  allowSelfAssign,
  assignees,
  parentTasks,
}: {
  task: TaskRow
  depth: 0 | 1
  showAssignee: boolean
  canEdit?: boolean
  isIntern?: boolean
  currentUserId?: string
  allowSelfAssign?: boolean
  assignees?: Assignee[]
  parentTasks?: ParentTask[]
}) {
  const isAssignedToMe = currentUserId !== undefined && task.assignee_id === currentUserId

  return (
    <article
      className={
        depth === 1
          ? 'rounded-lg border border-border bg-muted/40 p-3.5'
          : 'rounded-lg border border-border bg-card p-4 shadow-card'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold ${depth === 1 ? 'flex items-center gap-1.5' : ''}`}>
          {depth === 1 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary">
              <GitBranch className="size-3.5" weight="bold" /> Sub
            </span>
          )}
          <span className={depth === 1 ? 'text-foreground/90' : ''}>{task.title}</span>
        </h3>
        <Badge variant={statusVariant(task.status)}>{statusLabel(task.status)}</Badge>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
        {task.category && (
          <span className="rounded-md bg-accent px-2 py-0.5 font-medium text-foreground/80">{task.category}</span>
        )}
        <Badge variant={statusVariant(task.priority)}>{statusLabel(task.priority)}</Badge>
        {creatorName(task) && (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <UserCircle className="size-3 text-primary" weight="bold" />
            Người giao: {creatorName(task)}
          </span>
        )}
        {showAssignee && (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <User className="size-3 text-primary" weight="bold" />
            Phụ trách: {assigneeName(task) ?? 'Chưa rõ'}
          </span>
        )}
        {task.deadline && (
          <span className="flex items-center gap-1">
            <CalendarBlank className="size-3 text-primary" weight="bold" />
            Hạn: {compactDate(task.deadline)}
          </span>
        )}
        {task.completion_status === 'on_time' && (
          <Badge variant="success">
            <CheckCircle className="mr-1 size-3" weight="bold" />
            Đúng hạn
          </Badge>
        )}
        {task.completion_status === 'late' && (
          <Badge variant="danger">
            <Prohibit className="mr-1 size-3" weight="bold" />
            Trễ hạn
          </Badge>
        )}
      </div>

      {task.submission_url && (
        <a
          href={task.submission_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-primary no-underline hover:underline"
        >
          <Rocket className="size-3 shrink-0" weight="bold" />
          <span className="truncate">Kết quả nộp bài</span>
        </a>
      )}

      {task.feedback && (
        <div className="mt-2 rounded-md border border-warning/20 bg-warning/8 px-2.5 py-1.5 text-[11px] leading-relaxed text-warning-foreground">
          <span className="font-semibold">Phản hồi: </span>
          {task.feedback}
        </div>
      )}

      {canEdit && currentUserId && assignees && parentTasks && (
        <TaskEditSection
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            deadline: task.deadline,
            assignee_id: task.assignee_id,
            parent_task_id: task.parent_task_id,
          }}
          currentUserId={currentUserId}
          allowSelfAssign={allowSelfAssign ?? false}
          assignees={assignees}
          parentTasks={parentTasks}
        />
      )}

      {isIntern && isAssignedToMe && <InternActions task={task} />}
      {!isIntern && canEdit && <ReviewActions task={task} />}
    </article>
  )
}

export function TaskTree({
  tasks,
  showAssignee = false,
  canEdit = false,
  isIntern = false,
  currentUserId,
  allowSelfAssign = false,
  assignees = [],
  parentTasks = [],
}: {
  tasks: TaskRow[]
  showAssignee?: boolean
  canEdit?: boolean
  isIntern?: boolean
  currentUserId?: string
  allowSelfAssign?: boolean
  assignees?: Assignee[]
  parentTasks?: ParentTask[]
}) {
  if (tasks.length === 0) return null

  const byParent = new Map<string | null, TaskRow[]>()
  tasks.forEach((task) => {
    const key = task.parent_task_id
    byParent.set(key, [...(byParent.get(key) ?? []), task])
  })

  const roots = byParent.get(null) ?? []

  // Orphaned children (parent filtered out by select scope) attach to a virtual root.
  const parentIds = new Set(tasks.filter((t) => t.parent_task_id === null).map((t) => t.id))
  const orphans = tasks.filter((t) => t.parent_task_id !== null && !parentIds.has(t.parent_task_id))

  return (
    <div className="space-y-4">
      {roots.map((root) => {
        const children = byParent.get(root.id) ?? []
        return (
          <div key={root.id} className="space-y-2.5">
            <TaskCard
              task={root}
              depth={0}
              showAssignee={showAssignee}
              canEdit={canEdit}
              isIntern={isIntern}
              currentUserId={currentUserId}
              allowSelfAssign={allowSelfAssign}
              assignees={assignees}
              parentTasks={parentTasks}
            />
            {children.length > 0 && (
              <div className="ml-4 space-y-2.5 border-l border-border pl-3.5">
                {children.map((child) => (
                  <TaskCard
                    key={child.id}
                    task={child}
                    depth={1}
                    showAssignee={showAssignee}
                    canEdit={canEdit}
                    isIntern={isIntern}
                    currentUserId={currentUserId}
                    allowSelfAssign={allowSelfAssign}
                    assignees={assignees}
                    parentTasks={parentTasks}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
      {orphans.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          depth={0}
          showAssignee={showAssignee}
          canEdit={canEdit}
          isIntern={isIntern}
          currentUserId={currentUserId}
          allowSelfAssign={allowSelfAssign}
          assignees={assignees}
          parentTasks={parentTasks}
        />
      ))}
    </div>
  )
}