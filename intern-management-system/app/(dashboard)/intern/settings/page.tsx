import { getSession } from '@/lib/session'
import { SettingsForm } from '@/components/interns/settings-form'
import { PageHeader } from '@/components/page/page-header'

export default async function SettingsPage() {
  const { user, profile } = await getSession()
  if (!user || !profile) return null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin hiển thị và kiểm tra phân quyền tài khoản."
      />

      <SettingsForm
        fullName={profile.full_name}
        email={profile.email ?? ''}
        university={profile.university ?? ''}
        major={profile.major ?? ''}
        avatarUrl={profile.avatar_url ?? ''}
        role={profile.role}
      />
    </div>
  )
}