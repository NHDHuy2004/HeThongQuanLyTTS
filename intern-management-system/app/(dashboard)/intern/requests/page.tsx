import { createClient } from '@/lib/supabase/server'
import { createRequest, reviewRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { FileCheck2, Clock, Check, X, AlertCircle } from 'lucide-react'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, mentor_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const isIntern = profile.role === 'intern'
  const isMentor = profile.role === 'mentor'
  const isAdmin = profile.role === 'admin'
  const isReviewer = isAdmin || isMentor

  // Fetch requests based on role
  let query = supabase
    .from('leave_requests')
    .select('id, type, reason, start_date, end_date, status, intern_id, mentor_id, created_at, profiles!leave_requests_intern_id_fkey(full_name, email)')
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          {isAdmin && 'Quản trị hệ thống'}
          {isMentor && 'Bàn làm việc Mentor'}
          {isIntern && 'Dịch vụ sinh viên'}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isIntern ? 'Xin nghỉ phép / Làm việc tại nhà (WFH)' : 'Phê duyệt đơn nghỉ phép & WFH'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isIntern && 'Tạo yêu cầu nghỉ phép hoặc làm việc từ xa gửi đến người hướng dẫn.'}
          {isMentor && 'Xem xét và phê duyệt các đơn xin nghỉ phép của thực tập sinh phụ trách.'}
          {isAdmin && 'Giám sát và điều phối toàn bộ đơn nghỉ phép trong toàn hệ thống.'}
        </p>
      </div>

      {/* Intern Request Form */}
      {isIntern && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="size-4 text-orange-600" /> Tạo đơn xin nghỉ mới
            </h2>
            <p className="text-xs text-slate-500">Điền thông tin bên dưới để gửi yêu cầu phê duyệt</p>
          </div>

          {!profile.mentor_id && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="size-4 shrink-0" />
              Bạn chưa được phân công Mentor. Vui lòng báo với Quản trị viên để được gán Mentor trước khi gửi đơn.
            </div>
          )}

          <form action={createRequest} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại yêu cầu</label>
              <select
                name="type"
                className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
              >
                <option value="leave">Xin nghỉ phép</option>
                <option value="wfh">Làm việc từ xa (WFH)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Người duyệt (Mentor)</label>
              <select
                name="mentor_id"
                defaultValue={profile.mentor_id ?? ''}
                required
                disabled={!profile.mentor_id}
                className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
              >
                <option value="">-- Chọn Mentor duyệt đơn --</option>
                {allMentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.full_name}{mentor.id === profile.mentor_id ? ' (Mentor được phân công)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày bắt đầu</label>
              <Input name="start_date" type="date" required className="h-10" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày kết thúc</label>
              <Input name="end_date" type="date" required className="h-10" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lý do cụ thể</label>
              <textarea
                name="reason"
                required
                placeholder="Trình bày lý do xin nghỉ phép hoặc xin WFH..."
                className="min-h-24 w-full rounded-lg border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700"
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={!profile.mentor_id} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white">
                Gửi đơn phê duyệt
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Reviewer Section: Pending Requests requiring attention */}
      {isReviewer && pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-orange-950 dark:text-orange-300 flex items-center gap-2">
            <Clock className="size-4 text-orange-600" />
            Đơn đang chờ xem xét ({pendingRequests.length})
          </h2>
          <div className="grid gap-3">
            {pendingRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-orange-200 bg-orange-50/30 p-5 shadow-xs dark:border-orange-900/40 dark:bg-orange-950/20"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-slate-900 dark:text-slate-100">
                        {request.type === 'leave' ? '🏖️ Xin nghỉ phép' : '💻 Làm việc từ xa (WFH)'}
                      </span>
                      <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      Thực tập sinh: <strong>{(request as any).profiles?.full_name ?? 'N/A'}</strong> · Thời gian:{' '}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {request.start_date} → {request.end_date}
                      </span>
                    </p>
                    <p className="mt-3 text-sm bg-white p-3 rounded-lg border border-orange-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                      Lý do: {request.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={reviewRequest}>
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="status" value="approved" />
                      <Button size="sm" type="submit" className="gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
                        <Check className="size-3.5" /> Duyệt đơn
                      </Button>
                    </form>
                    <form action={reviewRequest}>
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <Button size="sm" variant="outline" type="submit" className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/40">
                        <X className="size-3.5" /> Từ chối
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* History Table or List */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {isIntern ? 'Danh sách đơn của bạn' : 'Lịch sử đơn đã giải quyết'}
        </h2>

        {(isIntern ? requests : resolvedRequests)?.length ? (
          <div className="grid gap-3">
            {(isIntern ? requests : resolvedRequests)?.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {request.type === 'leave' ? 'Xin nghỉ phép' : 'Làm việc từ xa (WFH)'}
                      </h3>
                      <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {!isIntern && `TTS: ${(request as any).profiles?.full_name ?? 'N/A'} · `}
                      Thời gian: {request.start_date} đến {request.end_date} · Gửi lúc:{' '}
                      {new Date(request.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">{request.reason}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            Chưa có đơn nào trong danh sách.
          </div>
        )}
      </section>
    </div>
  )
}