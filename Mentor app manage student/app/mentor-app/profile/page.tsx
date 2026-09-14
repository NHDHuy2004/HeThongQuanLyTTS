import { redirect } from 'next/navigation'
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut'
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear'
import { IdentificationCard } from '@phosphor-icons/react/dist/ssr/IdentificationCard'
import { Envelope } from '@phosphor-icons/react/dist/ssr/Envelope'
import { Users } from '@phosphor-icons/react/dist/ssr/Users'
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { SectionCard, SectionHeader } from '@/components/mentor-app/section-card'
import { Avatar } from '@/components/mentor-app/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/mentor-app/theme-toggle'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function ProfilePage() {
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const supabase = await createClient()

  const departmentRes = profile.department_id
    ? await supabase
        .from('departments')
        .select('name')
        .eq('id', profile.department_id)
        .maybeSingle()
    : null
  const departmentName = departmentRes?.data?.name ?? null

  const internQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'intern')
  const resolvedInternQuery =
    profile.role === 'mentor' ? internQuery.eq('mentor_id', user.id) : internQuery
  const { count: internCount } = await resolvedInternQuery

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <Avatar src={profile.avatar_url} name={profile.full_name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{profile.full_name}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          <span className="mt-1.5 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            Mentor
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Users className="size-4.5" weight="bold" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-none tabular-nums">{internCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Thuc tap sinh</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Buildings className="size-4.5" weight="bold" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {departmentName ?? 'Chua gan phong ban'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Phong ban</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <SectionCard>
        <SectionHeader title="Cau hinh" icon={Gear} />
        <div className="divide-y divide-border">
          <ThemeToggle />
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard>
        <SectionHeader title="Tai khoan" icon={IdentificationCard} />
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Envelope className="size-4" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Dia chi email</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarBlank className="size-4" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Tham gia tu</p>
              <p className="text-xs text-muted-foreground">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Logout */}
      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-11 w-full gap-2">
          <SignOut className="size-4" weight="bold" />
          Dang xuat
        </Button>
      </form>

      <p className="pb-1 text-center text-[10px] text-muted-foreground">
        Mentor App v0.1.0
      </p>
    </div>
  )
}