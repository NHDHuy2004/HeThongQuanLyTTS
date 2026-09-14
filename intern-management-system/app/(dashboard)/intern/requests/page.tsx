import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { EmptyState } from '@/components/page/empty-state'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { RequestForm } from '@/components/interns/request-form'
import { ReviewRequestButton } from '@/components/interns/review-request-button'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) return null

  const isIntern = profile.role === 'intern'
  const isMentor = profile.role === 'mentor'
  const isAdmin = profile.role === 'admin'
  const isReviewer = isAdmin || isMentor

  // Fetch requests based on role
  let query = supabase
    .from('leave_requests')
    .select('id, type, reason, start_date, end_date, status, intern_id, mentor_id, created_at, profiles!leave_requests_intern_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (isIntern) {
    query = query.eq('intern_id', user.id)
  } else if (isMentor) {
    query = query.eq('mentor_id', user.id)
  }

  const { data: requests } = await query

  // If intern, fetch mentor info or list of mentors
  let allMentors: any[] = []
  if (isIntern) {
    const { data: mentors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'mentor')
      .order('full_name')
    allMentors = mentors ?? []
  }

  const pendingRequests = requests?.filter((r) => r.status === 'pending') ?? []
  const resolvedRequests = requests?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={isAdmin ? 'Quản trị hệ thống' : isMentor ? 'Bàn làm việc Mentor' : 'Dịch vụ sinh viên'}
        title={isIntern ? 'Xin nghỉ phép / Làm việc tại nhà (WFH)' : 'Phê duyệt đơn nghỉ phép và WFH'}
        description={
          isIntern
            ? 'Tạo yêu cầu nghỉ phép hoặc làm việc từ xa gửi đến người hướng dẫn.'
            : isMentor
              ? 'Xem xét và phê duyệt các đơn xin nghỉ phép của thực tập sinh phụ trách.'
              : 'Giám sát và điều phối toàn bộ đơn nghỉ phép trong toàn hệ thống.'
        }
      />

      {/* Intern Request Form */}
      {isIntern && (
        <SectionCard>
          <SectionHeader
            title="Tạo đơn xin nghỉ mới"
            description="Điền thông tin bên dưới để gửi yêu cầu phê duyệt"
            icon={FileText}
          />
          <div className="p-5">
            {!profile.mentor_id && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 p-3 text-xs text-warning-foreground">
                <WarningCircle className="size-4 shrink-0" weight="bold" />
                Bạn chưa được phân công Mentor. Vui lòng báo với Quản trị viên để được gán Mentor trước khi gửi đơn.
              </div>
            )}

            <RequestForm assignedMentorId={profile.mentor_id} mentors={allMentors} />
          </div>
        </SectionCard>
      )}

      {/* Reviewer Section: Pending Requests requiring attention */}
      {isReviewer && pendingRequests.length > 0 && (
        <SectionCard>
          <SectionHeader
            title="Đơn đang chờ xem xét"
            icon={Clock}
            action={
              <Badge variant="warning" className="tabular-nums">
                {pendingRequests.length} đơn
              </Badge>
            }
          />
          <div className="divide-y divide-border">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {request.type === 'leave' ? 'Xin nghỉ phép' : 'Làm việc từ xa (WFH)'}
                    </p>
                    <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Thực tập sinh: <strong className="font-semibold text-foreground">{(request as any).profiles?.full_name ?? 'N/A'}</strong> - Thời gian:{' '}
                    <span className="font-medium text-foreground tabular-nums">
                      {request.start_date} đến {request.end_date}
                    </span>
                  </p>
                  <p className="mt-3 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                    Lý do: {request.reason}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <ReviewRequestButton requestId={request.id} status="approved">
                    Duyệt đơn
                  </ReviewRequestButton>
                  <ReviewRequestButton requestId={request.id} status="rejected">
                    Từ chối
                  </ReviewRequestButton>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* History Table or List */}
      <SectionCard>
        <SectionHeader
          title={isIntern ? 'Danh sách đơn của bạn' : 'Lịch sử đơn đã giải quyết'}
          icon={FileText}
          action={
            <Badge variant="default" className="tabular-nums">
              {(isIntern ? requests : resolvedRequests)?.length ?? 0} đơn
            </Badge>
          }
        />
        {(isIntern ? requests : resolvedRequests)?.length ? (
          <div className="divide-y divide-border">
            {(isIntern ? requests : resolvedRequests)?.map((request) => (
              <div key={request.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {request.type === 'leave' ? 'Xin nghỉ phép' : 'Làm việc từ xa (WFH)'}
                    </h3>
                    <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {!isIntern && `TTS: ${(request as any).profiles?.full_name ?? 'N/A'} - `}
                    Thời gian: {request.start_date} đến {request.end_date} - Gửi lúc:{' '}
                    {new Date(request.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="mt-2.5 text-sm text-muted-foreground">{request.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Chưa có đơn nào"
            description="Các đơn xin nghỉ phép hoặc WFH sẽ xuất hiện ở đây."
          />
        )}
      </SectionCard>
    </div>
  )
}