import { createClient } from '@/lib/supabase/server'
import { updatePermission } from './actions'
import { Button } from '@/components/ui/button'

const roleLabels = { admin: 'Admin', mentor: 'Mentor', intern: 'Intern' } as const
type Role = keyof typeof roleLabels

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (actor?.role !== 'admin') {
    return <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Bạn không có quyền truy cập trang phân quyền.</div>
  }

  const { data: profiles } = await supabase.from('profiles').select('id,full_name,email,role,mentor_id').order('full_name')
  const mentors = profiles?.filter((profile) => profile.role === 'mentor') ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Quản trị hệ thống</p>
        <h1 className="text-2xl font-semibold tracking-tight">Phân quyền tài khoản</h1>
        <p className="mt-1 text-sm text-slate-500">Đổi vai trò và phân công Mentor mà không cần chạy SQL.</p>
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 sm:grid">
          <span>Tài khoản</span><span>Vai trò</span><span>Mentor hiện tại</span><span>Thay đổi</span><span />
        </div>
        {profiles?.map((profile) => {
          const currentRole = profile.role as Role
          return (
            <form key={profile.id} action={updatePermission} className="grid gap-3 border-b border-slate-100 p-5 last:border-0 dark:border-slate-800 sm:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] sm:items-center sm:gap-4">
              <input type="hidden" name="profile_id" value={profile.id} />
              <div className="min-w-0"><p className="truncate text-sm font-medium">{profile.full_name}</p><p className="truncate text-xs text-slate-500">{profile.email}</p></div>
              <span className="text-xs text-slate-500 sm:hidden">Vai trò hiện tại: {roleLabels[currentRole]}</span>
              <select name="role" defaultValue={currentRole} className="h-9 rounded-md border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"><option value="admin">Admin</option><option value="mentor">Mentor</option><option value="intern">Intern</option></select>
              <select name="mentor_id" defaultValue={profile.mentor_id ?? ''} className="h-9 rounded-md border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"><option value="">Chưa phân công</option>{mentors.filter((mentor) => mentor.id !== profile.id).map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.full_name}</option>)}</select>
              <Button size="sm" type="submit">Lưu</Button>
            </form>
          )
        })}
      </section>
    </div>
  )
}
