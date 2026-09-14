import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { toVietnamDate } from '@/lib/format'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip'
import { User } from '@phosphor-icons/react/dist/ssr/User'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { EmptyState } from '@/components/page/empty-state'
import { ReportReviewForm } from '@/components/reports/report-review-form'

function formatCreated(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timingBadge(report: {
  submitted_at: string | null
  due_date: string | null
}): { variant: 'success' | 'danger' | null; label: string | null } {
  if (!report.submitted_at || !report.due_date) return { variant: null, label: null }
  const submitted = toVietnamDate(new Date(report.submitted_at))
  const onTime = submitted <= report.due_date
  return onTime
    ? { variant: 'success', label: 'Nộp đúng hạn' }
    : { variant: 'danger', label: 'Nộp trễ hạn' }
}

export default async function MentorReportsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile || profile.role !== 'mentor') redirect('/login')

  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('mentor_id', user.id)
    .eq('role', 'intern')
    .order('full_name')

  const internIds = (interns ?? []).map((i) => i.id)

  for (const internId of internIds) {
    await supabase.rpc('ensure_periodic_reports', { p_intern_id: internId })
  }

  const { data: rawReports } = internIds.length > 0
    ? await supabase
        .from('periodic_reports')
        .select(
          'id, period_number, due_date, submitted_at, content, attachment_url, mentor_feedback, status, created_at, intern_id, tasks(title), profiles!periodic_reports_intern_id_fkey(full_name)',
        )
        .in('intern_id', internIds)
        .order('period_number', { ascending: false })
    : { data: [] }

  const reports = (rawReports ?? []).filter((r) => r.tasks !== null && r.profiles !== null)

  const signedUrls = new Map<string, string>()
  for (const report of reports) {
    if (!report.attachment_url) continue
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(report.attachment_url, 3600)
    if (data?.signedUrl) signedUrls.set(report.id, data.signedUrl)
  }

  const pendingCount = reports.filter((r) => r.status === 'pending' || r.status === 'late').length
  const unreviewedCount = reports.filter((r) => r.status === 'submitted').length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bàn làm việc Mentor"
        title="Báo cáo định kỳ của Thực tập sinh"
        description={`Theo dõi tiến độ theo từng đợt báo cáo. Có ${pendingCount} đợt chưa nộp và ${unreviewedCount} báo cáo chờ nhận xét.`}
      />

      {internIds.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có Thực tập sinh phụ trách"
          description="Bạn chưa được phân công phụ trách Thực tập sinh nào."
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có báo cáo định kỳ nào"
          description="Hệ thống tự tạo các đợt báo cáo theo thời hạn thực tập. Thực tập sinh sẽ nộp báo cáo khi đến hạn."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const fileUrl = signedUrls.get(report.id)
            const timing = timingBadge(report)
            return (
              <SectionCard key={report.id}>
                <SectionHeader
                  title={`Đợt ${report.period_number}`}
                  description={`${report.profiles?.full_name ?? 'Thực tập sinh'} - ${report.tasks?.title ?? 'Công việc'} - hạn nộp ${report.due_date}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <CalendarBlank className="size-3.5" weight="bold" />
                        {formatCreated(report.created_at)}
                      </span>
                      {timing.variant && timing.label && (
                        <Badge variant={timing.variant}>{timing.label}</Badge>
                      )}
                      <Badge variant={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
                    </div>
                  }
                />

                {report.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {report.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {report.status === 'pending' || report.status === 'late'
                      ? 'Thực tập sinh chưa nộp nội dung cho đợt này.'
                      : 'Nội dung không khả dụng.'}
                  </p>
                )}

                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary no-underline hover:bg-accent/80"
                  >
                    <Paperclip className="size-3.5" weight="bold" />
                    Tệp đính kèm
                  </a>
                )}

                {report.mentor_feedback && (
                  <div className="mt-4 rounded-md border border-success/25 bg-success/10 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success">
                      <User className="size-3.5" weight="bold" />
                      Nhận xét đã lưu
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                      {report.mentor_feedback}
                    </p>
                  </div>
                )}

                {report.status === 'submitted' && <ReportReviewForm reportId={report.id} />}
              </SectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}