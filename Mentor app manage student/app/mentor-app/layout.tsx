import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { MobileShell } from '@/components/mentor-app/mobile-shell'
import type { InternOption } from '@/components/mentor-app/create-task-sheet'

export default async function MentorAppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession()

  if (!user || !profile) redirect('/login')
  if (profile.role !== 'mentor') redirect(`/${profile.role}`)

  const supabase = await createClient()
  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internOptions: InternOption[] = (interns ?? []).map((i) => ({
    id: i.id,
    full_name: i.full_name,
    email: i.email,
    avatar_url: i.avatar_url,
  }))

  return (
    <MobileShell profile={profile} interns={internOptions}>
      {children}
    </MobileShell>
  )
}