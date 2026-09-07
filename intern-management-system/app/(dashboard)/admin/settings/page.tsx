import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/(dashboard)/intern/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, university, major, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect(`/${profile?.role ?? 'login'}`)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Quản trị hệ thống</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ Quản trị viên</h1>
        <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị của tài khoản quản trị.</p>
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
            Đơn vị / Trường
            <Input name="university" defaultValue={profile.university ?? ''} placeholder="Đại học Đà Lạt" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Phòng ban / Khoa
            <Input name="major" defaultValue={profile.major ?? ''} placeholder="Khoa Công nghệ Thông tin" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
            Đường dẫn ảnh đại diện (Avatar URL)
            <Input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ''} placeholder="https://..." className="h-10" />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Phân quyền tài khoản:</span>
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/60 dark:text-rose-300">
              Quản trị viên (Admin)
            </span>
          </div>
          <Button type="submit" className="bg-rose-700 hover:bg-rose-800 text-white">
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  )
}
