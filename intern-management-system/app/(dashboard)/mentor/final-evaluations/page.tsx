import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { Quotes } from '@phosphor-icons/react/dist/ssr/Quotes'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Badge, statusVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { EmptyState } from '@/components/page/empty-state'
import { FinalEvaluationForm } from '@/components/interns/final-evaluation-form'

const recommendationLabels: Record<string, string> = {
  pass: 'Hoàn thành thực tập',
  fail: 'Chưa đạt yêu cầu',
  offer_job: 'Đề nghị tuyển dụng',
}

export default async function MentorFinalEvaluationsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile || profile.role !== 'mentor') redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, start_date, end_date, internship_status')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = (interns ?? []).map((i) => i.id)

  type EvaluationRow = {
  intern_id: string
  overall_score: number | null
  grade: string | null
  recommendation: string
  general_feedback: string | null
  created_at: string
}

const { data: evaluations } = internIds.length > 0
    ? await supabase
        .from('final_evaluations')
        .select('intern_id, overall_score, grade, recommendation, general_feedback, created_at')
        .in('intern_id', internIds)
    : { data: [] as EvaluationRow[] }

  const evaluationByIntern = new Map(
    (evaluations ?? []).map((evaluation) => [evaluation.intern_id, evaluation]),
  )

  const internList = (interns ?? []).map((intern) => ({
    id: intern.id,
    full_name: intern.full_name,
    end_date: intern.end_date,
    internship_status: intern.internship_status,
    evaluation: evaluationByIntern.get(intern.id) ?? null,
  }))

  const evaluatedCount = internList.filter((i) => i.evaluation).length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bàn làm việc Mentor"
        title="Đánh giá Tổng quan Cuối kỳ & Giấy chứng nhận"
        description={`Đánh giá tổng quan cuối kỳ là bước cuối để Thực tập sinh hoàn thành chương trình và nhận Giấy chứng nhận. Đã hoàn thành ${evaluatedCount}/${internList.length} thực tập sinh.`}
      />

      {internList.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Chưa có Thực tập sinh phụ trách"
          description="Bạn chưa được phân công phụ trách Thực tập sinh nào."
        />
      ) : (
        <>
          <SectionCard>
            <SectionHeader
              title="Nhập Đánh giá Tổng quan cuối kỳ"
              icon={Medal}
              description="Chọn Thực tập sinh, ghi điểm tổng quan và kết luận. Có thể lưu lại để chỉnh sửa."
            />
            <FinalEvaluationForm
              targetInterns={internList.map((i) => ({ id: i.id, full_name: i.full_name, evaluated: Boolean(i.evaluation) }))}
            />
          </SectionCard>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Danh sách đã đánh giá</h2>
            {evaluatedCount === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 p-4 text-xs text-warning-foreground">
                <WarningCircle className="size-4 shrink-0" weight="bold" />
                Chưa có thực tập sinh nào được đánh giá tổng quan. Sử dụng form phía trên để bắt đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {internList.map((intern) => {
                  const evaluation = intern.evaluation
                  if (!evaluation) return null
                  const scoreText = evaluation.overall_score
                    ? `${evaluation.overall_score}/10`
                    : null
                  return (
                    <SectionCard key={intern.id}>
                      <SectionHeader
                        title={intern.full_name}
                        description={
                          evaluation.grade
                            ? `Xếp loại ${evaluation.grade}${scoreText ? ` - Điểm tổng quan ${scoreText}` : ''}`
                            : `Điểm tổng quan ${scoreText}`
                        }
                        action={
                          <Badge variant={statusVariant(evaluation.recommendation ?? 'pass')}>
                            {recommendationLabels[evaluation.recommendation] ?? evaluation.recommendation}
                          </Badge>
                        }
                      />
                      {evaluation.general_feedback && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3.5">
                          <Quotes className="mt-0.5 size-3.5 shrink-0 text-primary" weight="bold" />
                          <p className="text-xs leading-relaxed italic text-muted-foreground">
                            &quot;{evaluation.general_feedback}&quot;
                          </p>
                        </div>
                      )}
                    </SectionCard>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}