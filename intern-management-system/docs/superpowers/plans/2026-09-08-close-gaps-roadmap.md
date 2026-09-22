# Plan: Lấp gap lộ trình 7 bước (Rà soát & lấp gap)

Ngày: 2026-09-08. Trạng thái project: đã dựng gần hoàn chỉnh, cần lấp gap đối chiếu với spec.

## Nhóm 1 - Auth proxy (Bước 3)
- Giữ `proxy.ts` (Next 16: middleware được đổi tên thành proxy).
- Kiểm tra build/lint.

## Nhóm 2 - Schema upgrade (Bước 2)
- Migration `task_status` (todo|doing|done) -> (pending_acceptance|in_progress|under_review|completed|rejected).
- Thêm cột `tasks`: `completion_status` (on_time|late|null), `accepted_at`, `submitted_at`, `completed_at`, `submission_url`, `feedback`.
- Trigger DB tự tính `completion_status` khi task đạt `completed` (so sánh `completed_at` vs `deadline`).
- Sửa trigger `prevent_intern_task_edit` cho phép intern cập nhật status + timestamps + submission_url.
- Tạo bảng `weekly_reports` (task_id, intern_id, week_number, content, attachment_url, mentor_feedback, status submitted|reviewed) + RLS + realtime publication.
- Cập nhật `lib/supabase/database.types.ts` (enum task_status, cột mới, bảng weekly_reports).

## Nhóm 3 - Task workflow (Bước 5)
- Server action `updateTaskStatus` -> hỗ trợ chuyển trạng thái theo role:
  - Intern: xác nhận (-> in_progress, set accepted_at), nộp bài (-> under_review, set submitted_at + submission_url).
  - Mentor: duyệt (-> completed, set completed_at, DB tự set on_time/late), yêu cầu làm lại (-> in_progress + feedback), từ chối (-> rejected).
- UI: 5 cột workflow, nút context theo role, badge đúng/trễ hạn, feedback, link kết quả.

## Nhóm 4 - Báo cáo tuần + Navigation (Bước 6)
- Intern: `/intern/reports` tab "Báo cáo tuần", form nộp (tuần, chọn task, nội dung, tệp đính kèm -> storage `documents`).
- Mentor: `/mentor/reports` xem báo cáo của TTS được phụ trách + ghi nhận xét (mark reviewed).
- Thêm nav item `Báo cáo tuần` cho intern + mentor.

## Nhóm 5 - Realtime + Deploy (Bước 7)
- Realtime: subscribe INSERT `weekly_reports` trong `realtime-notifications.tsx`.
- README: hướng dẫn deploy Vercel + chạy migration.

## Verify
- `npm run lint`, `npx tsc --noEmit` (hoặc build).