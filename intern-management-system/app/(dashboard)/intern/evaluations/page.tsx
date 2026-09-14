import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Star } from '@phosphor-icons/react/dist/ssr/Star'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { Quotes } from '@phosphor-icons/react/dist/ssr/Quotes'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { EmptyState } from '@/components/page/empty-state'
import { EvaluationForm } from '@/components/interns/evaluation-form'

export default async function EvaluationsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) return null

  const isIntern = profile.role === 'intern'
  const isMentor = profile.role === 'mentor'
  const isAdmin = profile.role === 'admin'

  let evalQuery = supabase
    .from('evaluations')
    .select('id, type_period, feedback, scores_json, intern_id, mentor_id, created_at, profiles!evaluations_intern_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (isIntern) {
    evalQuery = evalQuery.eq('intern_id', user.id)
  } else if (isMentor) {
    evalQuery = evalQuery.eq('mentor_id', user.id)
  }

  const { data: evaluations } = await evalQuery

  let targetInterns: Array<{ id: string; full_name: string }> = []
  if (isMentor) {
    const { data: myInterns } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('mentor_id', user.id)
      .eq('role', 'intern')
      .order('full_name')
    targetInterns = myInterns ?? []
  } else if (isAdmin) {
    const { data: allInterns } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'intern')
      .order('full_name')
    targetInterns = allInterns ?? []
  }

  const calcAverage = (scores: Record<string, number> = {}) => {
    const vals = Object.values(scores)
    if (!vals.length) return 0
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isIntern ? 'Kết quả đánh giá thực tập' : 'Đánh giá & Chấm điểm Thực tập sinh'}
        description={
          isIntern
            ? 'Xem kết quả đánh giá năng lực định kỳ (Giữa kỳ & Cuối kỳ) do Mentor ghi nhận.'
            : isMentor
              ? 'Chấm điểm và phản hồi nhận xét định kỳ cho các thực tập sinh bạn hướng dẫn.'
              : 'Báo cáo và tổng hợp kết quả đánh giá thực tập sinh toàn trường.'
        }
      />

      {!isIntern && (
        <SectionCard>
          <SectionHeader
            title="Nhập phiếu đánh giá thực tập"
            icon={Star}
            description={
              isMentor
                ? 'Đánh giá thực tập sinh thuộc danh sách phân công của bạn.'
                : 'Quản trị viên lập hoặc cập nhật đánh giá.'
            }
          />

          {isMentor && targetInterns.length === 0 ? (
            <div className="m-5 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 p-4 text-xs text-warning-foreground">
              <WarningCircle className="size-4 shrink-0" weight="bold" />
              Bạn hiện chưa có thực tập sinh nào được phân công để đánh giá.
            </div>
          ) : (
            <EvaluationForm targetInterns={targetInterns} />
          )}
        </SectionCard>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Medal className="size-4 text-primary" weight="bold" />
            {isIntern ? 'Phiếu kết quả đánh giá của bạn' : 'Danh sách phiếu đánh giá đã hoàn thành'}
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">{evaluations?.length ?? 0} phiếu</span>
        </div>

        {evaluations?.length ? (
          <SectionCard>
            <div className="divide-y divide-border">
              {evaluations.map((ev) => {
                const scores = (ev.scores_json as Record<string, number>) ?? {}
                const avg = calcAverage(scores)

                return (
                  <div key={ev.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge variant={statusVariant(ev.type_period)}>
                          {statusLabel(ev.type_period)}
                        </Badge>
                        <h3 className="mt-1.5 text-sm font-semibold">
                          {(ev as any).profiles?.full_name ?? profile.full_name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Ngày đánh giá: {new Date(ev.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-center rounded-lg bg-primary/10 px-3 py-2 text-primary">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Điểm TB</span>
                        <span className="text-xl font-bold tabular-nums">{avg}</span>
                        <span className="text-[9px] text-muted-foreground">/ 10</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Chuyên môn</p>
                        <p className="mt-1 text-base font-bold tabular-nums">
                          {scores.technical !== undefined ? `${scores.technical}/10` : '--'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Làm việc nhóm</p>
                        <p className="mt-1 text-base font-bold tabular-nums">
                          {scores.teamwork !== undefined ? `${scores.teamwork}/10` : '--'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Kỷ luật</p>
                        <p className="mt-1 text-base font-bold tabular-nums">
                          {scores.discipline !== undefined ? `${scores.discipline}/10` : '--'}
                        </p>
                      </div>
                    </div>

                    {ev.feedback && (
                      <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Quotes className="size-3.5 text-primary" weight="bold" />
                          {isIntern ? 'Nhận xét từ Mentor:' : 'Nhận xét đã gửi:'}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed italic">
                          &quot;{ev.feedback}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        ) : (
          <EmptyState
            icon={Medal}
            title={
              isIntern
                ? 'Chưa có kết quả đánh giá nào'
                : 'Chưa có phiếu đánh giá nào được ghi nhận'
            }
            description={
              isIntern
                ? 'Mentor sẽ tiến hành đánh giá năng lực của bạn vào các đợt Giữa kỳ và Cuối kỳ.'
                : 'Sử dụng biểu mẫu phía trên để nhập phiếu đánh giá cho sinh viên.'
            }
          />
        )}
      </section>
    </div>
  )
}