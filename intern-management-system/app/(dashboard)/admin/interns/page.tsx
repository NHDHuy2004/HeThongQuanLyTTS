import { createClient } from '@/lib/supabase/server'
import { updatePermission } from './actions'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserCheck, GraduationCap, AlertCircle, Save } from 'lucide-react'

const roleLabels = {
  admin: 'Quản trị viên (Admin)',
  mentor: 'Người hướng dẫn (Mentor)',
  intern: 'Thực tập sinh (Intern)',
} as const

const roleBadgeColors = {
  admin: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/40',
  mentor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40',
  intern: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/40',
}

type Role = keyof typeof roleLabels

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actor?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        Bạn không có quyền truy cập trang quản trị phân quyền này.
      </div>
    )
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, mentor_id, university, major')
    .order('full_name')

  const adminCount = profiles?.filter((p) => p.role === 'admin').length ?? 0
  const mentorCount = profiles?.filter((p) => p.role === 'mentor').length ?? 0
  const internCount = profiles?.filter((p) => p.role === 'intern').length ?? 0
  const unassignedCount = profiles?.filter((p) => p.role === 'intern' && !p.mentor_id).length ?? 0

  const mentors = profiles?.filter((profile) => profile.role === 'mentor') ?? []
  const mentorMap = new Map(mentors.map((m) => [m.id, m.full_name]))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Khu vực Quản trị tối cao</p>
        <h1 className="text-2xl font-semibold tracking-tight">Phân quyền tài khoản & Chỉ định Mentor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tách biệt quyền hạn người dùng giữa Quản trị viên, Mentor và Thực tập sinh.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Quản trị viên</span>
            <ShieldCheck className="size-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">{adminCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Mentor</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{mentorCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Thực tập sinh</span>
            <GraduationCap className="size-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">{internCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>TTS chưa gán Mentor</span>
            <AlertCircle className="size-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">{unassignedCount}</p>
        </div>
      </section>

      {/* User permissions list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Danh sách tất cả tài khoản trong hệ thống ({profiles?.length ?? 0})
          </h2>
        </div>

        <div className="hidden grid-cols-[1.4fr_1fr_1.1fr_1.3fr_auto] gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900 sm:grid">
          <span>Thông tin tài khoản</span>
          <span>Vai trò hiện tại</span>
          <span>Mentor phụ trách</span>
          <span>Thay đổi vai trò & Mentor</span>
          <span />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {profiles?.map((p) => {
            const currentRole = p.role as Role
            const isCurrentUser = p.id === user.id
            const assignedMentorName = p.mentor_id ? mentorMap.get(p.mentor_id) : null

            return (
              <form
                key={p.id}
                action={updatePermission}
                className="grid gap-3 p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 sm:grid-cols-[1.4fr_1fr_1.1fr_1.3fr_auto] sm:items-center sm:gap-4"
              >
                <input type="hidden" name="profile_id" value={p.id} />

                {/* Account details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{p.full_name}</p>
                    {isCurrentUser && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        (Bạn)
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{p.email}</p>
                  {(p.university || p.major) && (
                    <p className="truncate text-[11px] text-slate-400 mt-0.5">
                      {p.university} {p.major ? `• ${p.major}` : ''}
                    </p>
                  )}
                </div>

                {/* Current Role Badge */}
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[currentRole]}`}>
                    {roleLabels[currentRole]}
                  </span>
                </div>

                {/* Current Mentor */}
                <div>
                  {currentRole === 'intern' ? (
                    assignedMentorName ? (
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {assignedMentorName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertCircle className="size-3" /> Chưa phân công
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </div>

                {/* Selects to update role and mentor */}
                <div className="flex flex-col gap-1.5">
                  <select
                    name="role"
                    defaultValue={currentRole}
                    className="h-8 rounded-lg border border-slate-200 bg-transparent px-2.5 text-xs dark:border-slate-700"
                  >
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="mentor">Người hướng dẫn (Mentor)</option>
                    <option value="intern">Thực tập sinh (Intern)</option>
                  </select>

                  <select
                    name="mentor_id"
                    defaultValue={p.mentor_id ?? ''}
                    className="h-8 rounded-lg border border-slate-200 bg-transparent px-2.5 text-xs dark:border-slate-700"
                  >
                    <option value="">-- Chưa gán Mentor --</option>
                    {mentors
                      .filter((mentor) => mentor.id !== p.id)
                      .map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          Mentor: {mentor.full_name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Save button */}
                <div>
                  <Button size="sm" type="submit" className="gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
                    <Save className="size-3.5" /> Lưu
                  </Button>
                </div>
              </form>
            )
          })}
        </div>
      </section>
    </div>
  )
}
