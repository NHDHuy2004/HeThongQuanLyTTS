import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createEvaluation } from '@/app/(dashboard)/intern/evaluations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Award, MessageSquareQuote } from 'lucide-react'

export default async function AdminEvaluationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') redirect(`/${currentProfile?.role ?? 'login'}`)

  // Fetch all evaluations
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, type_period, feedback, scores_json, intern_id, mentor_id, created_at, profiles!evaluations_intern_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  // All interns
  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'intern')
    .order('full_name')

  const targetInterns = interns ?? []

  const calcAverage = (scores: Record<string, number> = {}) => {
    const vals = Object.values(scores)
    if (!vals.length) return 0
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Quản trị hệ thống</p>
        <h1 className="text-2xl font-semibold tracking-tight">Báo cáo & Đánh giá Thực tập sinh toàn trường</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi chất lượng đào tạo, kết quả đánh giá năng lực Giữa kỳ và Cuối kỳ.
        </p>
      </div>

      {/* Admin can also create or edit evaluations */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Star className="size-4 text-amber-500" /> Nhập hoặc điều chỉnh phiếu đánh giá
          </h2>
          <p className="text-xs text-slate-500">Quản trị viên có thể trực tiếp nhập đánh giá cho bất kỳ sinh viên nào</p>
        </div>

        <form action={createEvaluation} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thực tập sinh <span className="text-red-500">*</span>
            </label>
            <select
              name="intern_id"
              required
              className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
            >
              <option value="">-- Chọn thực tập sinh --</option>
              {targetInterns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kỳ đánh giá <span className="text-red-500">*</span>
            </label>
            <select
              name="type_period"
              className="h-10 w-full rounded-lg border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"
            >
              <option value="midterm">Đánh giá Giữa kỳ</option>
              <option value="final">Đánh giá Cuối kỳ (Tổng kết)</option>
            </select>
          </div>

          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl dark:bg-slate-800/50">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kỹ thuật & Chuyên môn (0-10)
              </label>
              <Input name="technical" type="number" min="0" max="10" step="0.5" placeholder="8.5" required className="h-9 bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Làm việc nhóm & Giao tiếp (0-10)
              </label>
              <Input name="teamwork" type="number" min="0" max="10" step="0.5" placeholder="9.0" required className="h-9 bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kỷ luật & Tác phong (0-10)
              </label>
              <Input name="discipline" type="number" min="0" max="10" step="0.5" placeholder="9.5" required className="h-9 bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nhận xét & Phản hồi
            </label>
            <textarea
              name="feedback"
              placeholder="Ghi nhận ưu điểm và định hướng phát triển..."
              className="min-h-24 w-full rounded-lg border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700"
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">
              Lưu kết quả đánh giá
            </Button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="size-4 text-emerald-600" /> Toàn bộ phiếu đánh giá trong hệ thống ({evaluations?.length ?? 0})
          </h2>
        </div>

        {evaluations?.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {evaluations.map((ev) => {
              const scores = (ev.scores_json as Record<string, number>) ?? {}
              const avg = calcAverage(scores)

              return (
                <article
                  key={ev.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {ev.type_period === 'midterm' ? 'Đánh giá Giữa kỳ' : 'Đánh giá Cuối kỳ'}
                      </span>
                      <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                        {(ev as any).profiles?.full_name ?? 'Thực tập sinh'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Ngày đánh giá: {new Date(ev.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-2.5 text-white shadow-xs">
                      <span className="text-[10px] font-medium uppercase tracking-wider">Điểm TB</span>
                      <span className="text-xl font-black">{avg}</span>
                      <span className="text-[9px] text-emerald-200">/ 10</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                      <p className="text-[11px] font-medium text-slate-500">Chuyên môn</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        {scores.technical !== undefined ? `${scores.technical}/10` : '--'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                      <p className="text-[11px] font-medium text-slate-500">Làm việc nhóm</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        {scores.teamwork !== undefined ? `${scores.teamwork}/10` : '--'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                      <p className="text-[11px] font-medium text-slate-500">Kỷ luật</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        {scores.discipline !== undefined ? `${scores.discipline}/10` : '--'}
                      </p>
                    </div>
                  </div>

                  {ev.feedback && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <MessageSquareQuote className="size-3.5 text-emerald-600" />
                        Nhận xét:
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic">
                        &quot;{ev.feedback}&quot;
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            Chưa có phiếu đánh giá nào trong hệ thống.
          </div>
        )}
      </section>
    </div>
  )
}
