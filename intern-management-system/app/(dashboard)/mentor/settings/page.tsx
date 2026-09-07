import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/(dashboard)/intern/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function MentorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, university, major, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'mentor') redirect(`/${profile?.role ?? 'login'}`)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Bàn làm việc Mentor</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị của Người hướng dẫn.</p>
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
            Đơn vị / Cơ quan
            <Input name="university" defaultValue={profile.university ?? ''} placeholder="Đại học Đà Lạt" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Bộ phận / Chuyên môn
            <Input name="major" defaultValue={profile.major ?? ''} placeholder="Kỹ thuật phần mềm" className="h-10" />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
            Đường dẫn ảnh đại diện (Avatar URL)
            <Input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ''} placeholder="https://..." className="h-10" />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Phân quyền tài khoản:</span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/60 dark:text-emerald-300">
              Người hướng dẫn (Mentor)
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
