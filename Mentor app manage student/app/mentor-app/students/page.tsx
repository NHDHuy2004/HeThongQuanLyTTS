import { redirect } from 'next/navigation'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { EmptyState } from '@/components/mentor-app/empty-state'
import { StudentList } from '@/components/mentor-app/student-list'
import type { InternSummary } from '@/components/mentor-app/student-detail-sheet'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, university, major, avatar_url, start_date, end_date, internship_status',
    )
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internList = (interns ?? []) as InternSummary[]

  return (
    <div className="space-y-4">
      {internList.length > 0 ? (
        <StudentList interns={internList} />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Chua co sinh vien"
          description="Sinh vien duoc phan cong cho ban se hien thi tai day."
        />
      )}
    </div>
  )
}