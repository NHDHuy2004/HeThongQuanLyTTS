import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { CertificatePrintButton } from '@/components/interns/certificate-print-button'

const recommendationLabels: Record<string, string> = {
  pass: 'HOÀN THÀNH CHƯƠNG TRÌNH THỰC TẬP',
  fail: 'CHƯA ĐẠT YÊU CẦU',
  offer_job: 'HOÀN THÀNH XUẤT SẮC',
}

export default async function InternCertificatePage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile || profile.role !== 'intern') redirect('/login')

  const { data: evaluation } = await supabase
    .from('final_evaluations')
    .select(
      'id, overall_score, grade, work_attitude_score, skill_score, recommendation, general_feedback, created_at, profiles!final_evaluations_mentor_id_fkey(full_name)',
    )
    .eq('intern_id', user.id)
    .maybeSingle()

  if (!evaluation || profile.internship_status !== 'completed_internship') {
    redirect('/intern/final-evaluations')
  }

  const startText = profile.start_date
    ? new Date(`${profile.start_date}T00:00:00`).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null
  const endText = profile.end_date
    ? new Date(`${profile.end_date}T00:00:00`).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null
  const issuedText = new Date(evaluation.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const serial = `DLU-ITCT-${new Date(evaluation.created_at).getFullYear()}-${evaluation.id.slice(0, 6).toUpperCase()}`
  const scoreText =
    evaluation.overall_score !== null ? `${Number(evaluation.overall_score)}/10` : null
  const gradeText = evaluation.grade ? `Xếp loại ${evaluation.grade}` : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <p className="text-sm font-semibold">Giấy chứng nhận của bạn</p>
          <p className="text-xs text-muted-foreground">
            Dùng nút bên phải để in hoặc lưu thành PDF.
          </p>
        </div>
        <CertificatePrintButton />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="border-[3px] border-primary/70 bg-card p-3 shadow-card">
          <div className="flex flex-col items-center gap-1 border border-border p-8 text-center sm:p-10">
            <Image
              src="/dlu-logo.png"
              alt="Logo Đại học Đà Lạt"
              width={72}
              height={72}
              className="size-16 rounded-full object-contain"
            />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trường Đại học Đà Lạt
            </p>
            <p className="text-xs font-medium text-foreground">Trung tâm CNTT - Hệ thống Quản lý Thực tập</p>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-primary">GIẤY CHỨNG NHẬN</h1>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">
              {recommendationLabels[evaluation.recommendation]}
            </p>

            <div className="my-6 h-px w-2/3 bg-primary/30" />

            <p className="text-sm leading-7 text-foreground">
              Trung tâm CNTT, Trường Đại học Đà Lạt chứng nhận:
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-primary">{profile.full_name}</p>
            <p className="mt-1 text-sm italic text-muted-foreground">
              Sinh viên {profile.university ? `trường ${profile.university}` : ''}
              {profile.major ? ` - Ngành ${profile.major}` : ''}
            </p>

            <p className="mt-6 max-w-xl text-sm leading-6 text-foreground">
              Đã hoàn thành chương trình thực tập tại Trung tâm CNTT, Trường Đại học Đà Lạt
              {startText && endText ? ` trong thời gian từ ${startText} đến ${endText}` : ''} và đạt kết quả
              {scoreText ? <span className="font-semibold"> {scoreText}</span> : null}
              {gradeText ? <span className="font-semibold"> ({gradeText})</span> : null}
              {evaluation.work_attitude_score !== null ? (
                <span> - Thái độ làm việc {Number(evaluation.work_attitude_score)}/10</span>
              ) : null}
              {evaluation.skill_score !== null ? (
                <span> - Kỹ năng chuyên môn {Number(evaluation.skill_score)}/10</span>
              ) : null}
              . Trong quá trình thực tập, sinh viên thể hiện tinh thần trách nhiệm và thái độ học tập nghiêm túc.
            </p>

            {evaluation.general_feedback && (
              <p className="mt-4 max-w-xl text-xs italic leading-5 text-muted-foreground">
                Nhận xét của Mentor: &quot;{evaluation.general_feedback}&quot;
              </p>
            )}

            <div className="mt-10 flex w-full items-end justify-between gap-4 text-left">
              <div>
                <p className="text-xs font-semibold">{evaluation.profiles?.full_name ?? 'Mentor phụ trách'}</p>
                <p className="text-[11px] text-muted-foreground">Người hướng dẫn (Mentor)</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Đà Lạt, ngày {issuedText}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">Số hiệu: {serial}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}