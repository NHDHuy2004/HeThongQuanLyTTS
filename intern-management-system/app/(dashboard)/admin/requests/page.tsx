import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reviewRequest } from '@/app/(dashboard)/dashboard/requests/actions'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge'
import { Clock, Check, X } from 'lucide-react'

export default async function AdminRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect(`/${currentProfile?.role ?? 'login'}`)

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('id, type, reason, start_date, end_date, status, intern_id, mentor_id, created_at, profiles!leave_requests_intern_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  const pendingRequests = requests?.filter((r) => r.status === 'pending') ?? []
  const resolvedRequests = requests?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Quản trị hệ thống</p>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý & Duyệt đơn nghỉ phép / WFH</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem xét, phê duyệt hoặc can thiệp xử lý toàn bộ đơn nghỉ phép trong toàn trường.
        </p>
      </div>

      {pendingRequests.length > 0 && (
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Lịch sử đơn đã giải quyết ({resolvedRequests.length})
        </h2>

        {resolvedRequests.length ? (
          <div className="grid gap-3">
            {resolvedRequests.map((request) => (
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
                      TTS: {(request as any).profiles?.full_name ?? 'N/A'} · Thời gian: {request.start_date} đến {request.end_date} · Gửi lúc:{' '}
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
            Chưa có đơn nào đã xử lý.
          </div>
        )}
      </section>
    </div>
  )
}
