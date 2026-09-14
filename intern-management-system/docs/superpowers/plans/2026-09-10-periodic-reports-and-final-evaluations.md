# Plan: Quản lý Thời hạn Thực tập, Báo cáo Định kỳ Linh hoạt & Đánh giá Tổng quan Cuối kỳ

Ngày: 2026-09-10. Trạng thái: dự án đã hoàn chỉnh luồng cũ (weekly reports, evaluations), cần nâng cấp nghiệp vụ.

## Mục tiêu nghiệp vụ

1. **Thời hạn thực tập**: `profiles` thêm `start_date`, `end_date`, `report_interval_days` (7/10/30) + trạng thái `internship_status` (`active` | `completed_internship`).
2. **Báo cáo định kỳ linh hoạt**: đổi bảng `weekly_reports` -> `periodic_reports` (theo `period_number`, `due_date`), hạn nộp tự tính theo `start_date` + `report_interval_days`. Status: `pending | submitted | late | reviewed`.
3. **Đánh giá tổng quan cuối kỳ**: bảng `final_evaluations`; sau khi Mentor lưu phải đánh giá:
   - Intern chuyển `internship_status` -> `completed_internship`.
   - Mở khóa trang Giấy chứng nhận (in / lưu PDF).

## Thiết kế

### DB (schema.sql + migration mới `2026-09-10-periodic-reports-and-final-evaluations.sql`)
- Enum mới: `internship_status`, `final_recommendation`.
- `profiles` + cột: `start_date date`, `end_date date`, `report_interval_days int` (check 7/10/30), `internship_status` default 'active'. Check `end_date >= start_date`.
- Migration `weekly_reports` -> `periodic_reports` idempotent: rename nếu còn bảng cũ, `period_number`/`due_date`/`submitted_at`, task_id cho phép null, content cho phép null, status text + check 4 trạng thái, unique `(intern_id, period_number)`; drop cột `week_number` + constraint/check cũ.
- Bảng `final_evaluations`: overall_score + grade (A-D), work_attitude_score, skill_score, general_feedback, recommendation, unique(intern_id), check "có điểm hoặc grade".
- Hàm `ensure_periodic_reports(intern_id)`: sinh rows 'pending' theo lịch + đánh dấu quá hạn -> 'late'. Trigger `profiles_sync_periodic_reports` chạy khi 3 cột thời hạn đổi.
- Trigger `final_evaluations_complete_internship`: sau insert final_evaluations -> set completed_internship.
- RLS + indexes + realtime (`periodic_reports`).

### App logic
- `lib/format.ts`: `toVietnamDate`, `addDays`, `daysBetween`, `internshipProgress`, `generatePeriodicDueDates`.
- `intern/reports/actions.ts`: `submitPeriodicReport` (update row period theo status pending/late -> submitted), `reviewPeriodicReport`. Trước khi đọc gọi rpc `ensure_periodic_reports`.
- `admin/interns/actions.ts`: `updatePermission` nhận thêm start/end/interval, gọi ensure sau khi lưu.
- `mentor/final-evaluations/actions.ts`: `submitFinalEvaluation` (upsert qui 1/intern), kiểm tra `is_mentor_of`.
- Pages: intern dashboard (progress + countdown), mentor dashboard (progress/từng intern + cảnh báo đánh giá cuối kỳ), intern reports (lịch định kỳ + form nộp theo từng đợt), mentor reports (phân loại đúng/trễ hạn), mentor final-evaluations (form tổng quan), intern final-evaluations (kết quả + Giấy chứng nhận), intern certificate (in/PDF).
- Nav: thêm mục mentor "Đánh giá tổng quan", intern "Kết quả & Chứng nhận".

### UI pattern
- Progress bar dùng thẻ div (không thư viện), track `bg-muted` fill `bg-primary`, radius md.
- In PDF: nút `window.print()` + Tailwind variant `print:hidden` trên aside/header của `dashboard-shell`.
- Tránh em-dash; nhãn tiếng Việt khớp chuẩn badged (`statusVariant`/`statusLabel`).

## Verify
- Không có test runner trong project (`package.json` không có test script) -> dùng `npm run lint` + `npx tsc --noEmit` + `npm run build`.

## Lưu ý
- `weekly-reports` được dùng ở: intern/reports page + actions, mentor/reports page, report-review-form, weekly-report-form, realtime-notifications, schema.sql, migration cũ. Thay toàn bộ.
- Giữ URL route cũ `/intern/reports`, `/mentor/reports` để không đổi nav; chỉ đổi nội dung sang "định kỳ".