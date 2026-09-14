import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, profile } = await getSession()

  if (!user || !profile) redirect('/login')

  return <DashboardShell profile={{ ...profile, email: profile.email ?? '' }}>{children}</DashboardShell>
}