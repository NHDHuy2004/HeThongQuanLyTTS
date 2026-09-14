# Plan: Duyet don xin nghi / WFH (Bước 4) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Badge chuông + feed thông báo đang đếm "đơn chờ duyệt" (leave_requests pending) nhưng mentor chưa có chỗ để duyệt/từ chối. Bước này thêm luồng review đơn ngay trong tab Thông báo theo pattern `reviewRequest` của app gốc (`intern-management-system/app/(dashboard)/intern/requests/actions.ts`).

## Phạm vi (actions)
- `lib/actions/requests.ts` (mới) - server action `reviewLeaveRequest(requestId, decision)`:
  - Zod: `{ request_id: uuid, decision: enum['approved','rejected'] }`.
  - Lấy user + profile; chỉ mentor/admin.
  - Fetch `leave_requests` theo id; mentor phải có `mentor_id === user.id`.
  - `update({ status: decision, reviewed_at: now })`.
  - `revalidatePath('/mentor-app/notifications')` + `/mentor-app/home`.
  - Trả `ActionResult` (pattern giống `createTasks` - input object, không FormData).
- `components/mentor-app/review-request-sheet.tsx` (mới) - client BottomSheet:
  - Props: `request: LeaveRequestDetail | null`, `onClose`.
  - Hiện tên intern, loại đơn (leave/WFH pill), ngày bắt đầu->kết thúc, lý do, thời gian tạo.
  - Nút "Duyet" (bg-success) và "Tu choi" (bg-destructive); từ chối 2 bước (tap 1 -> "Xac nhan tu choi?").
  - Submit qua action, toast success/error, đóng sheet + `router.refresh()`.
  - Export interface `LeaveRequestDetail`.
- `components/mentor-app/notification-feed.tsx` (mới) - client:
  - Nhận `requests`, `tasks`, `reports` (dữ liệu giàu từ server page), gộp + sort + render như cũ.
  - Request còn status `pending` -> tappable, mở ReviewRequestSheet. Item đã duyet/tu choi -> không mở (hiện badge status).
  - Chứa state select request + render sheet.
- `app/mentor-app/notifications/page.tsx` (sửa):
  - Select thêm `reason` cho request; chuyển phần render list vào `<NotificationFeed>`.
  - Giữ `<NotificationsRealtime userId internIds />`.
- `app/mentor-app/home/page.tsx` (sửa nhỏ): alert "Ban co N don can duyet" thành link `<a href="/mentor-app/notifications">`.

## Không làm
- Không review task submission (under_review) - bước riêng.
- Không thêm tab mới vào bottom nav (giữ 5 tab); review đơn nằm trong Thong bao.
- Không dùng confirm-dialog riêng; dùng 2-step reject trong sheet.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke test dev: `/login` 200, `/mentor-app/notifications` 307 -> login.