'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActionState } from 'react'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { FloppyDisk } from '@phosphor-icons/react/dist/ssr/FloppyDisk'
import { updatePermission } from '@/app/(dashboard)/admin/interns/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import type { ActionResult } from '@/lib/action-utils'

type Mentor = {
  id: string
  full_name: string
  department_id: string | null
  department_name: string | null
}

type Department = { id: string; name: string }

type Role = 'admin' | 'mentor' | 'intern'

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'admin', label: 'Quản trị viên (Admin)' },
  { value: 'mentor', label: 'Người hướng dẫn (Mentor)' },
  { value: 'intern', label: 'Thực tập sinh (Intern)' },
]

const initialState: ActionResult = { success: false }

export function PermissionRow({
  profileId,
  role: initialRole,
  mentorId: initialMentorId,
  departmentId: initialDepartmentId,
  startDate: initialStartDate,
  endDate: initialEndDate,
  reportIntervalDays: initialInterval,
  excludeUserId,
  departments,
  mentors,
}: {
  profileId: string
  role: Role
  mentorId: string | null
  departmentId: string | null
  startDate: string | null
  endDate: string | null
  reportIntervalDays: number | null
  excludeUserId: string
  departments: Department[]
  mentors: Mentor[]
}) {
  const [state, formAction, pending] = useActionState(updatePermission, initialState)
  const { toast } = useToast()

  const [role, setRole] = useState<Role>(initialRole)
  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? '')
  const [mentorId, setMentorId] = useState(initialMentorId ?? '')
  const [startDate, setStartDate] = useState(initialStartDate ?? '')
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [interval, setInterval] = useState(initialInterval ? String(initialInterval) : '')

  useEffect(() => {
    if (state.success) {
      toast('Đã cập nhật phân quyền thành công!')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  const mentorOptions = useMemo(
    () =>
      mentors.filter((m) => m.department_id === departmentId && m.id !== excludeUserId),
    [mentors, departmentId, excludeUserId],
  )

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value)
    if (mentorId) {
      const currentMentor = mentors.find((m) => m.id === mentorId)
      if (currentMentor?.department_id !== value) setMentorId('')
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="profile_id" value={profileId} />
      <input type="hidden" name="mentor_id" value={mentorId} />
      <input type="hidden" name="department_id" value={departmentId} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input type="hidden" name="report_interval_days" value={interval} />

      <Select
        name="role-display"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
      >
        {roleOptions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>

      {role === 'intern' ? (
        <>
          <Select name="department-display" value={departmentId} onChange={(e) => handleDepartmentChange(e.target.value)}>
            <option value="">- Chưa thuộc đơn vị -</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select
            name="mentor-display"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            disabled={departmentId === ''}
          >
            <option value="">
              {departmentId === '' ? 'Chọn Đơn vị trước' : '- Chưa gán Mentor -'}
            </option>
            {mentorOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
                {m.department_name ? ` - ${m.department_name}` : ''}
              </option>
            ))}
          </Select>
          {departmentId !== '' && mentorOptions.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Đơn vị này chưa có Mentor nào.</p>
          )}

          <div className="flex flex-wrap items-end gap-1.5 rounded-md border border-border bg-muted/30 p-2">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <CalendarBlank className="size-3.5" weight="bold" /> Thời hạn thực tập
            </span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Ngày bắt đầu thực tập"
              className="h-8 w-auto text-xs"
            />
            <span className="text-xs text-muted-foreground">đến</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Ngày kết thúc thực tập"
              className="h-8 w-auto text-xs"
            />
            <Select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              aria-label="Chu kỳ báo cáo định kỳ"
              className="h-8 w-auto text-xs"
            >
              <option value="">Chu kỳ báo cáo</option>
              <option value="7">7 ngày</option>
              <option value="10">10 ngày</option>
              <option value="30">30 ngày</option>
            </Select>
          </div>
        </>
      ) : (
        <Select
          name="department-display"
          value={departmentId}
          onChange={(e) => handleDepartmentChange(e.target.value)}
        >
          <option value="">- Chưa thuộc đơn vị -</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      )}

      <Button size="sm" type="submit" disabled={pending} className="gap-1 self-start">
        <FloppyDisk className="size-3.5" weight="bold" /> {pending ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </form>
  )
}