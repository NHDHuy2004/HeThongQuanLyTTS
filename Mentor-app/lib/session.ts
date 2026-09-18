import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

export interface SessionProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'mentor' | 'intern'
  avatar_url: string | null
  mentor_id: string | null
  department_id: string | null
  university: string | null
  major: string | null
  start_date: string | null
  end_date: string | null
  report_interval_days: number | null
  internship_status: 'active' | 'completed_internship'
  created_at: string
}

export interface Session {
  user: { id: string } | null
  profile: SessionProfile | null
}

export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`Không thể xác thực hồ sơ người dùng. Vui lòng thử lại. (${error.message})`)
  }

  return { user: { id: user.id }, profile: (profile as Tables<'profiles'> | null) ?? null }
})
