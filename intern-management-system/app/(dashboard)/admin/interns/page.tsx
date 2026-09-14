import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { UserCheck } from '@phosphor-icons/react/dist/ssr/UserCheck'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page/page-header'
import { StatCard } from '@/components/page/stat-card'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { PermissionRow } from '@/components/interns/permission-row'

const roleLabels = {
  admin: 'Quản trị viên (Admin)',
  mentor: 'Người hướng dẫn (Mentor)',
  intern: 'Thực tập sinh (Intern)',
} as const

const roleBadgeVariant = {
  admin: 'danger' as const,
  mentor: 'success' as const,
  intern: 'primary' as const,
}

type Role = keyof typeof roleLabels

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) return null

  if (profile.role !== 'admin') {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Bạn không có quyền truy cập trang quản trị phân quyền này.
      </div>
    )
  }

  const [profilesRes, departmentsRes, mentorsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, mentor_id, university, major, department_id, start_date, end_date, report_interval_days',
      )
      .order('full_name'),
    supabase
      .from('departments')
      .select('id, name')
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, department_id, departments!profiles_department_id_fkey(name)')
      .eq('role', 'mentor')
      .order('full_name'),
  ])

  const profiles = profilesRes.data ?? []
  const departments = departmentsRes.data ?? []
  const mentors = (mentorsRes.data ?? []).map((m) => ({
    id: m.id,
    full_name: m.full_name,
    department_id: m.department_id,
    department_name: m.departments?.name ?? null,
  }))

  const adminCount = profiles.filter((p) => p.role === 'admin').length
  const mentorCount = profiles.filter((p) => p.role === 'mentor').length
  const internCount = profiles.filter((p) => p.role === 'intern').length
  const unassignedCount = profiles.filter((p) => p.role === 'intern' && !p.mentor_id).length

  const mentorMap = new Map(mentors.map((m) => [m.id, m.full_name]))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Phân quyền tài khoản & Chỉ định Mentor"
        description="Chọn Đơn vị trước, sau đó gán Mentor thuộc đúng đơn vị cho Thực tập sinh."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quản trị viên" value={adminCount} icon={ShieldCheck} tone="danger" />
        <StatCard label="Mentor" value={mentorCount} icon={UserCheck} tone="success" />
        <StatCard label="Thực tập sinh" value={internCount} icon={GraduationCap} tone="primary" />
        <StatCard label="TTS chưa gán Mentor" value={unassignedCount} icon={WarningCircle} tone="warning" />
      </section>

      <SectionCard>
        <SectionHeader
          title="Danh sách tất cả tài khoản"
          description={`${profiles.length} tài khoản trong hệ thống`}
        />

        <div className="hidden grid-cols-[1.4fr_1fr_1.4fr_1.9fr] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Thông tin tài khoản</span>
          <span>Vai trò hiện tại</span>
          <span>Mentor phụ trách</span>
          <span>Đơn vị & Mentor (Cascading)</span>
        </div>

        <div className="divide-y divide-border">
          {profiles.map((p) => {
            const currentRole = p.role as Role
            const isCurrentUser = p.id === user.id
            const assignedMentorName = p.mentor_id ? mentorMap.get(p.mentor_id) : null

            return (
              <div
                key={p.id}
                className="grid gap-3 p-5 transition-colors hover:bg-muted/30 sm:grid-cols-[1.4fr_1fr_1.4fr_1.9fr] sm:items-start sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{p.full_name}</p>
                    {isCurrentUser && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        (Bạn)
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  {(p.university || p.major) && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                      {p.university} {p.major ? `- ${p.major}` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <Badge variant={roleBadgeVariant[currentRole]}>
                    {roleLabels[currentRole]}
                  </Badge>
                </div>

                <div>
                  {currentRole === 'intern' ? (
                    assignedMentorName ? (
                      <span className="text-xs font-medium">
                        {assignedMentorName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                        <WarningCircle className="size-3" weight="bold" /> Chưa phân công
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground/50">-</span>
                  )}
                </div>

                <PermissionRow
                  profileId={p.id}
                  role={currentRole}
                  mentorId={p.mentor_id}
                  departmentId={p.department_id}
                  startDate={p.start_date}
                  endDate={p.end_date}
                  reportIntervalDays={p.report_interval_days}
                  excludeUserId={p.id}
                  departments={departments}
                  mentors={mentors}
                />
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}