import { createClient } from '@/lib/supabase/server'
import { createEvaluation } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Award, CheckCircle2, MessageSquareQuote, AlertCircle } from 'lucide-react'

export default async function EvaluationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, mentor_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const isIntern = profile.role === 'intern'
  const isMentor = profile.role === 'mentor'
  const isAdmin = profile.role === 'admin'

  // Fetch evaluations based on role
  let evalQuery = supabase
    .from('evaluations')
    .select('id, type_period, feedback, scores_json, intern_id, mentor_id, created_at, profiles!evaluations_intern_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  if (isIntern) {
    evalQuery = evalQuery.eq('intern_id', user.id)
  } else if (isMentor) {
    evalQuery = evalQuery.eq('mentor_id', user.id)
  }

  const { data: evaluations } = await evalQuery

  // If Mentor, fetch only interns assigned to this mentor
  // If Admin, fetch all interns
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

  // Calculate average score helper
  const calcAverage = (scores: Record<string, number> = {}) => {
    const vals = Object.values(scores)
    if (!vals.length) return 0
    return (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {isAdmin && 'Quản trị hệ thống'}
          {isMentor && 'Bàn làm việc Mentor'}
          {isIntern && 'Hồ sơ học tập & Rèn luyện'}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isIntern ? 'Kết quả đánh giá thực tập' : 'Đánh giá & Chấm điểm Thực tập sinh'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isIntern && 'Xem kết quả đánh giá năng lực định kỳ (Giữa kỳ & Cuối kỳ) do Mentor ghi nhận.'}
          {isMentor && 'Chấm điểm và phản hồi nhận xét định kỳ cho các thực tập sinh bạn hướng dẫn.'}
          {isAdmin && 'Báo cáo và tổng hợp kết quả đánh giá thực tập sinh toàn trường.'}
        </p>
      </div>

      {/* ==================================================================== */}
      {/* MENTOR / ADMIN FORM                                                  */}
      {/* ==================================================================== */}
      {!isIntern && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="size-4 text-amber-500" /> Nhập phiếu đánh giá thực tập
            </h2>
            <p className="text-xs text-slate-500">
              {isMentor
                ? 'Đánh giá thực tập sinh thuộc danh sách phân công của bạn.'
                : 'Quản trị viên lập hoặc cập nhật đánh giá.'}
            </p>
          </div>

          {isMentor && targetInterns.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="size-4 shrink-0" />
              Bạn hiện chưa có thực tập sinh nào được phân công để đánh giá.
            </div>
          ) : (
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

              {/* Criteria scores */}
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl dark:bg-slate-800/50">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỹ thuật & Chuyên môn (0-10)
                  </label>
                  <Input
                    name="technical"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="8.5"
                    required
                    className="h-9 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Làm việc nhóm & Giao tiếp (0-10)
                  </label>
                  <Input
                    name="teamwork"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="9.0"
                    required
                    className="h-9 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỷ luật & Tác phong (0-10)
                  </label>
                  <Input
                    name="discipline"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="9.5"
                    required
                    className="h-9 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nhận xét & Định hướng phát triển
                </label>
                <textarea
                  name="feedback"
                  placeholder="Ghi nhận ưu điểm, những mặt cần cải thiện và lời khuyên dành cho sinh viên..."
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-emerald-600 dark:border-slate-700"
                />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  Lưu kết quả đánh giá
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* EVALUATION LIST / SCORECARDS                                         */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="size-4 text-emerald-600" />
            {isIntern ? 'Phiếu kết quả đánh giá của bạn' : 'Danh sách phiếu đánh giá đã hoàn thành'}
          </h2>
          <span className="text-xs text-slate-500">{evaluations?.length ?? 0} phiếu</span>
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
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {ev.type_period === 'midterm' ? 'Đánh giá Giữa kỳ' : 'Đánh giá Cuối kỳ (Tổng kết)'}
                      </span>
                      <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                        {(ev as any).profiles?.full_name ?? profile.full_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Ngày đánh giá: {new Date(ev.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Overall GPA score badge */}
                    <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-2.5 text-white shadow-xs">
                      <span className="text-[10px] font-medium uppercase tracking-wider">Điểm TB</span>
                      <span className="text-xl font-black">{avg}</span>
                      <span className="text-[9px] text-emerald-200">/ 10</span>
                    </div>
                  </div>

                  {/* Criteria Grid */}
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

                  {/* Feedback Quote */}
                  {ev.feedback && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <MessageSquareQuote className="size-3.5 text-emerald-600" />
                        Nhận xét từ Mentor:
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
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <Award className="mx-auto size-10 text-slate-300 dark:text-slate-700" />
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              {isIntern
                ? 'Hiện chưa có kết quả đánh giá nào được công bố cho bạn.'
                : 'Chưa có phiếu đánh giá nào được ghi nhận.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isIntern
                ? 'Mentor sẽ tiến hành đánh giá năng lực của bạn vào các đợt Giữa kỳ và Cuối kỳ.'
                : 'Sử dụng biểu mẫu phía trên để nhập phiếu đánh giá cho sinh viên.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}