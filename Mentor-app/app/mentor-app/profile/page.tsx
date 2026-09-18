import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { ProfileSettings } from '@/components/mentor-app/profile-settings'
import { Avatar } from '@/components/mentor-app/avatar'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()
  const { data: department } = profile.department_id
    ? await supabase
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .maybeSingle()
    : { data: null }
  const departmentName = department?.name ?? null

  return (
    <div className="flex flex-col pb-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 text-center shadow-sm">
        <Avatar
          src={profile.avatar_url}
          name={profile.full_name ?? 'Mentor'}
          size={80}
          className="mx-auto mb-3 rounded-full border-2 border-primary/20 shadow-md"
        />
        <p className="text-lg font-bold tracking-tight text-foreground">
          {profile.full_name ?? 'Mentor'}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {departmentName ?? 'Chưa gắn đơn vị'}
        </p>
        <p className="mx-auto mt-0.5 max-w-full break-words px-2 text-xs text-muted-foreground/80">
          {profile.email}
        </p>
        <Badge variant="secondary" className="mt-2.5 rounded-full px-3 text-xs">
          Người hướng dẫn (Mentor)
        </Badge>
      </div>

      <ProfileSettings fullName={profile.full_name ?? 'Mentor'} email={profile.email} />
    </div>
  )
}