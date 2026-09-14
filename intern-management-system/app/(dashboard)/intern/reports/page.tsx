import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { toVietnamDate } from '@/lib/format'
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { Notebook } from '@phosphor-icons/react/dist/ssr/Notebook'
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { InternshipProgress } from '@/components/interns/internship-progress'
import { PeriodicReportForm } from '@/components/reports/periodic-report-form'

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

export default async function InternReportsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile || profile.role !== 'intern') redirect('/login')

  await supabase.rpc('ensure_periodic_reports', { p_intern_id: user.id })

  const [tasksRes, reportsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('periodic_reports')
      .select(
        'id, task_id, period_number, due_date, submitted_at, content, attachment_url, mentor_feedback, status, created_at, tasks(title)',
      )
      .eq('intern_id', user.id)
      .order('period_number', { ascending: false }),
  ])

  const tasks = tasksRes.data ?? []
  const reports = (reportsRes.data ?? []).filter((r) => r.tasks !== null)
  const pendingReports = reports.filter((r) => r.status === 'pending' || r.status === 'late')
  const submittedReports = reports.filter((r) => r.status === 'submitted' || r.status === 'reviewed')

  const signedUrls = new Map<string, string>()
  for (const report of reports) {
    if (!report.attachment_url) continue
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(report.attachment_url, 3600)
    if (data?.signedUrl) signedUrls.set(report.id, data.signedUrl)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Không gian thực tập sinh"
        title="Báo cáo tiến độ định kỳ"
        description="Nộp một báo cáo cho từng đợt theo hạn đã được hệ thống tính từ thời hạn thực tập. Mentor sẽ đọc và để lại nhận xét."
      />

      {profile.start_date && profile.end_date && (
        <SectionCard>
          <SectionHeader
            title="Tiến độ thực tập"
            description={`Từ ${profile.start_date} đến ${profile.end_date}, hạn nộp mỗi ${profile.report_interval_days ?? '-'} ngày một đợt.`}
          />
          <InternshipProgress startDate={profile.start_date} endDate={profile.end_date} />
        </SectionCard>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Đợt cần nộp</h2>
        {pendingReports.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <Notebook className="size-8 text-muted-foreground/40" weight="duotone" />
            <p className="text-sm font-medium text-foreground">Không còn đợt báo cáo nào chưa nộp</p>
            <p className="max-w-sm px-6 text-xs text-muted-foreground">
              Bạn đã nộp đầy đủ các đợt báo cáo định kỳ. Hãy tiếp tục theo dõi lịch nộp mới từ Trưởng nhóm.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((report) => (
              <PeriodicReportForm
                key={report.id}
                report={{
                  id: report.id,
                  periodNumber: report.period_number ?? 0,
                  dueDate: report.due_date ?? '',
                }}
                tasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
                internId={user.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Lịch sử báo cáo đã nộp</h2>
        {submittedReports.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <Notebook className="size-8 text-muted-foreground/40" weight="duotone" />
            <p className="text-sm font-medium text-foreground">Chưa có báo cáo nào được nộp</p>
            <p className="max-w-sm px-6 text-xs text-muted-foreground">
              Nộp báo cáo đầu tiên bằng form phía trên để bắt đầu theo dõi tiến độ.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {submittedReports.map((report) => {
              const fileUrl = signedUrls.get(report.id)
              const timing = timingBadge(report)
              return (
                <li key={report.id} className="rounded-lg border border-border bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs tabular-nums text-primary">
                        Đợt {report.period_number}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <CalendarBlank className="size-3.5" weight="bold" />
                        Hạn nộp {report.due_date}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
                      {timing.variant && timing.label && (
                        <Badge variant={timing.variant}>{timing.label}</Badge>
                      )}
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCreated(report.created_at)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {report.content}
                  </p>

                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-primary no-underline hover:bg-accent/80"
                    >
                      <Paperclip className="size-3.5" weight="bold" />
                      Tệp đính kèm
                    </a>
                  )}

                  {report.mentor_feedback && (
                    <div className="mt-3 rounded-md border border-success/25 bg-success/10 px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success">
                        <FileText className="size-3.5" weight="bold" />
                        Nhận xét của Mentor
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                        {report.mentor_feedback}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}