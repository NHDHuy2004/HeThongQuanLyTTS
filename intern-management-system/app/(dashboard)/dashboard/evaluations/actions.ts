'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const evaluationSchema = z.object({
  intern_id: z.string().uuid(),
  type_period: z.enum(['midterm', 'final']),
  technical: z.coerce.number().min(0).max(10),
  teamwork: z.coerce.number().min(0).max(10),
  discipline: z.coerce.number().min(0).max(10),
  feedback: z.string().trim().max(2000).optional(),
})

export async function createEvaluation(formData: FormData) {
  const parsed = evaluationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Điểm đánh giá không hợp lệ.')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để đánh giá.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || actor.role === 'intern') {
    throw new Error('Thực tập sinh không có quyền thực hiện đánh giá.')
  }

  if (actor.role === 'mentor') {
    const { data: intern } = await supabase.from('profiles').select('mentor_id').eq('id', parsed.data.intern_id).single()
    if (intern?.mentor_id !== user.id) {
      throw new Error('Bạn chỉ có thể đánh giá thực tập sinh do mình hướng dẫn.')
    }
  }

  const { error } = await supabase.from('evaluations').upsert(
    {
      intern_id: parsed.data.intern_id,
      mentor_id: user.id,
      type_period: parsed.data.type_period,
      scores_json: {
        technical: parsed.data.technical,
        teamwork: parsed.data.teamwork,
        discipline: parsed.data.discipline,
      },
      feedback: parsed.data.feedback || null,
    },
    { onConflict: 'intern_id,mentor_id,type_period' }
  )
  if (error) throw new Error('Không thể lưu đánh giá.')
  revalidatePath('/dashboard/evaluations')
  revalidatePath('/dashboard')
}