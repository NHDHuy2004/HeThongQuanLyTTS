# Plan: Phan hoi bao cao dinh ky (Bước 7) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Feed thong bao hien "Bao cao dinh ky (Ky N) - Can phan hoi" (status `submitted`) nhung chua co action.
Buoc nay: tap report -> BottomSheet xem noi dung + attachment -> gui phan hoi -> status `reviewed` + `mentor_feedback`.

Bang `periodic_reports`: id, period_number, content, attachment_url, due_date, submitted_at, status (string), mentor_feedback, task_id.

## Phạm vi (actions)
- `lib/actions/reports.ts` (moi) - `reviewPeriodicReport(input)`:
  - Zod: `{ report_id: uuid, feedback: string trim min 3 max 2000 }`.
  - Chi mentor/admin; fetch report + join intern profile lấy `mentor_id`; mentor phai co `mentor_id === user.id`.
  - Status phai la `submitted`.
  - `update({ status: 'reviewed', mentor_feedback: feedback })`.
  - `revalidatePath('/mentor-app/notifications'|'/mentor-app/home')`.
- `components/mentor-app/review-report-sheet.tsx` (moi) - client BottomSheet:
  - Export `ReportForReview`: id, status, period_number, due_date, attachment_url, content, submitted_at, created_at, profiles(full_name, avatar_url).
  - Header: intern (avatar+name) + pill "Ky N" + status badge. Meta: due_date, submitted_at (relative).
  - Content text (whitespace-pre-wrap) + link attachment (mo tab moi, neu co).
  - Textarea phan hoi (bat buoc >= 3 ky tu, dem 2000) + nut "Gui phan hoi" (success). Toast + `router.refresh()`.
- `components/mentor-app/notification-feed.tsx` (sua): bo `ReportNotificationRow` cu, prop `reports` dung `ReportForReview[]`; report item -> tappable mo `ReviewReportSheet` (state `activeReport`).
- `app/mentor-app/notifications/page.tsx` (sua): select report them `due_date, attachment_url, content`, join them `avatar_url`; cast sang `ReportForReview`.

## Khong lam
- Khong them trang rieng cho report; khong xu ly `reviewed`/edit lai trong doi nay.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke test dev: `/login` 200, `/mentor-app/notifications` 307 -> login.