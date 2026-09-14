'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const scoreUnion = z.union([z.literal(''), z.literal(null), z.coerce.number().min(0).max(10)])
const gradeUnion = z.union([z.enum(['A', 'B', 'C', 'D']), z.literal('')])

const finalEvaluationSchema = z.object({
  intern_id: z.string().uuid(),
  overall_score: scoreUnion.optional(),
  grade: gradeUnion.optional(),
  work_attitude_score: scoreUnion.optional(),
  skill_score: scoreUnion.optional(),
  recommendation: z.enum(['pass', 'fail', 'offer_job']),
  general_feedback: z.string().trim().max(5000).optional(),
})

export async function submitFinalEvaluation(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = finalEvaluationSchema.safeParse({
    intern_id: formData.get('intern_id'),
    overall_score: formData.get('overall_score') ?? '',
    grade: formData.get('grade') ?? '',
    work_attitude_score: formData.get('work_attitude_score') ?? '',
    skill_score: formData.get('skill_score') ?? '',
    recommendation: formData.get('recommendation') ?? '',
    general_feedback: formData.get('general_feedback') ?? '',
  })
  if (!parsed.success) return fail('Thông tin đánh giá tổng quan không hợp lệ.')

  const overallScore = typeof parsed.data.overall_score === 'number' ? parsed.data.overall_score : null
  const grade = parsed.data.grade || null
  const workAttitude =
    typeof parsed.data.work_attitude_score === 'number' ? parsed.data.work_attitude_score : null
  const skillScore = typeof parsed.data.skill_score === 'number' ? parsed.data.skill_score : null

  if (overallScore === null && grade === null) {
    return fail('Cần nhập Điểm tổng quan (0-10) hoặc Xếp loại A/B/C/D.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để đánh giá.')

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor || actor.role === 'intern') {
    return fail('Thực tập sinh không có quyền thực hiện đánh giá tổng quan.')
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
      return fail('Bạn chỉ có thể đánh giá tổng quan cho thực tập sinh do mình hướng dẫn.')
    }
  }

  const { error } = await supabase.from('final_evaluations').upsert(
    {
      intern_id: parsed.data.intern_id,
      mentor_id: user.id,
      overall_score: overallScore,
      grade,
      work_attitude_score: workAttitude,
      skill_score: skillScore,
      recommendation: parsed.data.recommendation,
      general_feedback: parsed.data.general_feedback || null,
    },
    { onConflict: 'intern_id' }
  )
  if (error) return fail('Không thể lưu đánh giá tổng quan.')

  revalidatePaths()
  return OK
}

function revalidatePaths() {
  revalidatePath('/mentor/final-evaluations')
  revalidatePath('/intern/final-evaluations')
  revalidatePath('/intern/certificate')
  revalidatePath('/mentor')
  revalidatePath('/intern')
}