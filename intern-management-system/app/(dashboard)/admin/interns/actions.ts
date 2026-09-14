'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const permissionSchema = z.object({
  profile_id: z.string().uuid(),
  role: z.enum(['admin', 'mentor', 'intern']),
  mentor_id: z.union([z.string().uuid(), z.literal('')]),
  department_id: z.union([z.string().uuid(), z.literal('')]),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  report_interval_days: z.union([z.literal(''), z.literal(null), z.coerce.number().int().positive()]).optional(),
})

export async function updatePermission(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = permissionSchema.safeParse({
    profile_id: formData.get('profile_id'),
    role: formData.get('role'),
    mentor_id: formData.get('mentor_id') ?? '',
    department_id: formData.get('department_id') ?? '',
    start_date: formData.get('start_date') ?? '',
    end_date: formData.get('end_date') ?? '',
    report_interval_days: formData.get('report_interval_days') ?? '',
  })
  if (!parsed.success) return fail('Thông tin phân quyền không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để thực hiện thao tác này.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (actor?.role !== 'admin') return fail('Chỉ Admin mới được thay đổi phân quyền.')

  if (parsed.data.profile_id === user.id && parsed.data.role !== 'admin') {
    const { count: adminCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((adminCount ?? 0) <= 1) {
      return fail('Không thể tự hạ quyền vì bạn là Quản trị viên duy nhất của hệ thống.')
    }
  }

  const mentorId = parsed.data.role === 'intern' ? parsed.data.mentor_id || null : null
  const departmentId = parsed.data.department_id || null

  const startDate = parsed.data.start_date ? parsed.data.start_date.trim() : null
  const endDate = parsed.data.end_date ? parsed.data.end_date.trim() : null
  const rawInterval = parsed.data.report_interval_days ?? null
  const reportIntervalDays =
    typeof rawInterval === 'number' ? rawInterval : null

  if (startDate && endDate && endDate < startDate) {
    return fail('Ngày kết thúc thực tập phải không nhỏ hơn ngày bắt đầu.')
  }
  if (reportIntervalDays !== null && ![7, 10, 30].includes(Number(reportIntervalDays))) {
    return fail('Chu kỳ báo cáo chỉ nhận các giá trị 7, 10 hoặc 30 ngày.')
  }

  if (mentorId) {
    const { data: mentor } = await supabase
      .from('profiles')
      .select('id, role, department_id')
      .eq('id', mentorId)
      .maybeSingle()

    if (!mentor || mentor.role !== 'mentor') {
      return fail('Người được chọn làm Mentor không hợp lệ.')
    }
    if (mentor.department_id !== departmentId) {
      return fail('Mentor phải thuộc cùng đơn vị được chọn của Thực tập sinh.')
    }
    if (mentor.id === parsed.data.profile_id) {
      return fail('Người dùng không thể làm Mentor cho chính mình.')
    }
  }

  const isIntern = parsed.data.role === 'intern'
  const { error } = await supabase
    .from('profiles')
    .update({
      role: parsed.data.role,
      mentor_id: mentorId,
      department_id: departmentId,
      ...(isIntern
        ? {
            start_date: startDate,
            end_date: endDate,
            report_interval_days: reportIntervalDays,
          }
        : {}),
    })
    .eq('id', parsed.data.profile_id)
  if (error) return fail('Không thể cập nhật phân quyền.')

  if (isIntern) {
    await supabase.rpc('ensure_periodic_reports', { p_intern_id: parsed.data.profile_id })
  }

  revalidatePath('/admin/interns')
  return OK
}