import { createClient } from '@/lib/supabase/server'
import { updateProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const roleLabels = {
  admin: 'Quản trị viên (Admin)',
  mentor: 'Người hướng dẫn (Mentor)',
  intern: 'Thực tập sinh (Intern)',
} as const

const roleBadgeColors = {
  admin: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
  mentor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
  intern: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, university, major, avatar_url')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const roleKey = (profile.role ?? 'intern') as keyof typeof roleLabels

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tài khoản & Phân quyền</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị và kiểm tra phân quyền tài khoản.</p>
      </div>

      <form action={updateProfile} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Họ và tên
            <Input name="full_name" defaultValue={profile.full_name} required className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email tài khoản
            <Input value={profile.email} disabled className="h-10 bg-slate-50 text-slate-500 dark:bg-slate-800" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Trường đại học
            <Input name="university" defaultValue={profile.university ?? ''} placeholder="Đại học Đà Lạt" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chuyên ngành đào tạo
            <Input name="major" defaultValue={profile.major ?? ''} placeholder="Công nghệ thông tin" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
            Đường dẫn ảnh đại diện (Avatar URL)
            <Input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ''} placeholder="https://..." className="h-10" />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Phân quyền tài khoản:</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeColors[roleKey]}`}>
              {roleLabels[roleKey]}
            </span>
          </div>
          <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  )
}