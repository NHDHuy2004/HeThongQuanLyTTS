import { createClient } from '@/lib/supabase/server'
import { updateProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('full_name,email,role,university,major,avatar_url').eq('id', user.id).single()
  if (!profile) return null

  return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tài khoản</p><h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị của bạn.</p></div><form action={updateProfile} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Họ và tên<Input name="full_name" defaultValue={profile.full_name} required /></label><label className="space-y-2 text-sm font-medium">Email<Input value={profile.email} disabled /></label><label className="space-y-2 text-sm font-medium">Trường đại học<Input name="university" defaultValue={profile.university ?? ''} /></label><label className="space-y-2 text-sm font-medium">Chuyên ngành<Input name="major" defaultValue={profile.major ?? ''} /></label><label className="space-y-2 text-sm font-medium sm:col-span-2">Avatar URL<Input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ''} placeholder="https://..." /></label></div><div className="flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800"><span className="text-sm text-slate-500">Vai trò hiện tại: <strong className="text-slate-900 dark:text-white">{profile.role}</strong></span><Button type="submit">Lưu thay đổi</Button></div></form></div>
}