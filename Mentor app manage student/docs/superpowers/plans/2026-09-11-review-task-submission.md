# Plan: Review bai nop task (Bước 5) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Feed thông báo đang hiện "Nop bai: <title>" (status `under_review`) nhưng mentor chưa duyệt/trả bài được.
Bước này thêm luồng review bài nộp: tap card task `under_review` (ở tab Viec can lam hoặc tab Thong bao) -> BottomSheet hiện chi tiết + nút Duyet / Tu choi (kèm feedback).

## Phạm vi (actions)
- `lib/actions/tasks.ts` (sửa) - thêm `reviewTaskSubmission(input)`:
  - Zod: `{ task_id: uuid, decision: enum['approved','rejected'], feedback? string <=2000 }`.
  - Không bắt buộc feedback khi duyet; BẮT BUỘC >= 3 ky tu khi tu choi (validate phia server).
  - Chi mentor/admin; task thuoc intern cua mentor (`assignee.mentor_id === user.id`); status phai la `under_review`.
  - approved -> `status:'completed', completed_at: now, completion_status: deadline && deadline<now ? 'late' : 'on_time'`, luu feedback neu co.
  - rejected -> `status:'rejected', feedback`.
  - `revalidatePath('/mentor-app/tasks'|'/mentor-app/notifications'|'/mentor-app/home')`.
- `components/mentor-app/review-task-sheet.tsx` (mới) - client BottomSheet:
  - Export interface `TaskForReview`: id, title, description, category, priority, status, deadline, submission_url, submitted_at, created_at, profiles(full_name, avatar_url).
  - Hien: title + priority badge, intern (Avatar + name), category, deadline, description, submitted_at, link submission_url (mo tab moi), Badge status.
  - Feedback textarea (hint "(bat buoc khi tu choi)" + dem ky tu).
  - Duyet (success) ngay; Tu choi (destructive) 2-step + bat buoc feedback. Toast + `router.refresh()`.
- `components/mentor-app/task-list.tsx` (mới) - client: render card task active; `under_review` -> button mo sheet (giu markup giong trang hien tai). Chua ReviewTaskSheet.
- `app/mentor-app/tasks/page.tsx` (sửa): select them description/submission_url/submitted_at/feedback; phan active dung `<TaskList>`; gio completed server.
- `components/mentor-app/notification-feed.tsx` (sửa): task items -> tappable mo ReviewTaskSheet; prop tasks dung type `TaskForReview`.
- `app/mentor-app/notifications/page.tsx` (sửa): select task them cac field can cho sheet.

## Khong lam
- Khong tao TaskDetail sheet cho status khac (pending_acceptance/in_progress) - chi under_review co action.
- Khong sua completed list.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke test dev: `/login` 200, `/mentor-app/tasks` 307 -> login.