import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { Star } from '@phosphor-icons/react/dist/ssr/Star'
import { Badge, statusVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { EmptyState } from '@/components/page/empty-state'

const recommendationLabels: Record<string, string> = {
  pass: 'Hoàn thành thực tập',
  fail: 'Chưa đạt yêu cầu',
  offer_job: 'Đề nghị tuyển dụng',
}

export default async function InternFinalEvaluationsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile || profile.role !== 'intern') redirect('/login')

  const { data: evaluation } = await supabase
    .from('final_evaluations')
    .select('overall_score, grade, work_attitude_score, skill_score, recommendation, general_feedback, created_at, profiles!final_evaluations_mentor_id_fkey(full_name)')
    .eq('intern_id', user.id)
    .maybeSingle()

  const completed = profile.internship_status === 'completed_internship'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Không gian thực tập sinh"
        title="Kết quả Tổng quan & Giấy chứng nhận"
        description="Kết quả Đánh giá Tổng quan cuối kỳ do Mentor ghi nhận và Giấy chứng nhận hoàn thành thực tập."
      />

      {!evaluation ? (
        <EmptyState
          icon={Medal}
          title="Chưa có kết quả tổng quan"
          description="Mentor sẽ tiến hành Đánh giá Tổng quan khi kỳ thực tập của bạn đến hạn. Kết quả và Giấy chứng nhận sẽ xuất hiện tại đây."
        />
      ) : (
        <>
          <SectionCard>
            <SectionHeader
              title="Đánh giá Tổng quan cuối kỳ"
              icon={Star}
              description={`Đánh giá bởi ${evaluation.profiles?.full_name ?? 'Mentor'} - ngày ${new Date(evaluation.created_at).toLocaleDateString('vi-VN')}`}
              action={
                <Badge variant={statusVariant(evaluation.recommendation ?? 'pass')}>
                  {recommendationLabels[evaluation.recommendation] ?? evaluation.recommendation}
                </Badge>
              }
            />
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Điểm tổng quan</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {evaluation.overall_score ? `${evaluation.overall_score}/10` : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Xếp loại</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {evaluation.grade ?? '--'}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Thái độ làm việc</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {evaluation.work_attitude_score ? `${evaluation.work_attitude_score}/10` : '--'}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">Kỹ năng chuyên môn</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                  {evaluation.skill_score ? `${evaluation.skill_score}/10` : '--'}
                </p>
              </div>
            </div>
            {evaluation.general_feedback && (
              <div className="px-5 pb-5">
                <p className="rounded-lg bg-muted p-4 text-xs leading-relaxed italic text-muted-foreground">
                  &quot;{evaluation.general_feedback}&quot;
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title="Giấy chứng nhận hoàn thành thực tập"
              icon={SealCheck}
              description={
                completed
                  ? 'Chương trình thực tập của bạn đã hoàn thành. Giấy chứng nhận sẵn sàng để in hoặc lưu PDF.'
                  : 'Giấy chứng nhận được mở khóa sau khi Mentor hoàn tất Đánh giá Tổng quan.'
              }
            />
            <div className="p-5">
              {completed ? (
                <Link
                  href="/intern/certificate"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors hover:bg-primary/90"
                >
                  <SealCheck className="size-4" weight="bold" />
                  Xem & in Giấy chứng nhận
                </Link>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Medal className="size-4 text-warning" weight="bold" />
                  Vui lòng theo dõi để biết kết quả sau khi Mentor hoàn tất đánh giá.
                </p>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}