'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const evaluationSchema = z.object({
  intern_id: z.string().uuid(),
  type_period: z.enum(['midterm', 'final']),
  technical: z.coerce.number().min(0).max(10),
  teamwork: z.coerce.number().min(0).max(10),
  discipline: z.coerce.number().min(0).max(10),
  feedback: z.string().trim().max(2000).optional(),
})

export async function createEvaluation(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = evaluationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fail('Điểm đánh giá không hợp lệ.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để đánh giá.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || actor.role === 'intern') {
    return fail('Thực tập sinh không có quyền thực hiện đánh giá.')
  }

  if (parsed.data.intern_id === user.id) {
    return fail('Bạn không thể tự đánh giá chính mình.')
  }

  if (actor.role === 'mentor') {
    const { data: intern } = await supabase
      .from('profiles')
      .select('mentor_id')
      .eq('id', parsed.data.intern_id)
      .single()
    if (!intern || intern.mentor_id !== user.id) {
      return fail('Bạn chỉ có thể đánh giá thực tập sinh do mình hướng dẫn.')
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
  if (error) return fail('Không thể lưu đánh giá.')

  revalidatePath('/intern/evaluations')
  revalidatePath('/intern')
  return OK
}