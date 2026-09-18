# Plan: Notifications & Realtime (Bước 3) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Trang `/mentor-app/notifications` và `/mentor-app/tasks` hiện là server components tĩnh; nội dung chỉ tươi khi navigate/refresh. Bước này thêm:
1. Badge số "việc cần bạn xử lý" lên icon chuông ở Top Bar, cập nhật realtime.
2. Luồng realtime khiến danh sách thông báo và danh sách task tự làm mới khi có thay đổi từ DB.
3. Feed thông báo bổ sung luồng `periodic_reports` (đã nộp, chờ feedback) cho nhất quán với badge và màn Home.

## Phạm vi (actions)
- `lib/hooks/use-realtime.ts` (mới) - hook client `useRealtimeEvents(specs, onEvent)`:
  single channel, đăng ký từng table qua `postgres_changes` (event `*`) với filter dạng
  `assignee_id=in.(id1,id2)`, `mentor_id=eq.<userId>`, `intern_id=in.(...)`.
  Cleanup bằng `supabase.removeChannel`. `onEvent` giữ qua ref để tránh resubscribe.
- `components/mentor-app/notification-badge.tsx` (mới) - client:
  - Render link chuông + badge đỏ `destructive` (ẩn khi count = 0; "99+" nếu vượt).
  - Count = pending `leave_requests` (mentor_id=me) + `tasks` status `under_review`
    (assignee là intern của tôi) + `periodic_reports` status `submitted` (intern của tôi).
  - Fetch count: lúc mount (async), mỗi realtime event (debounce 400ms), và khi tab
    quay lại foreground (`focus`/`visibilitychange`) làm fallback khi realtime chưa bật.
- `components/mentor-app/notifications-realtime.tsx` (mới) - client, không hiển thị:
  subscribe 3 nguồn (leave_requests/tasks/periodic_reports) -> `router.refresh()` debounce 400ms.
- `components/mentor-app/tasks-realtime.tsx` (mới) - client, không hiển thị:
  subscribe `tasks` (assignee in) -> `router.refresh()` debounce 400ms.
  Cũng refetch khi tab quay lại foreground.
- `components/mentor-app/mobile-shell.tsx` (sửa) - thay icon chuông tĩnh bằng
  `<NotificationBadge userId={profile.id} internIds={interns.map(i => i.id)} />`.
- `app/mentor-app/notifications/page.tsx` (sửa) - thêm `periodic_reports` (submitted) vào feed
  (type `report`, time = `submitted_at ?? created_at`) + render `NotificationsRealtime`.
- `app/mentor-app/tasks/page.tsx` (sửa) - render `TasksRealtime`.

## Không làm (tránh scope creep)
- Không tạo bảng `notifications` mới (không có bảng này trong DB); feed là nguồn derived.
- Không thêm trang "đánh dấu đã đọc" (tồn tại "đã đọc" mới làm được khi có bảng riêng).
- Không sửa Home (đã có stats; phần "Hoạt động gần đây" để bước sau).
- Không thêm PWA push notification (bước roadmap khác).

## Điều kiện tiên quyết (cần làm thủ công trên Supabase dashboard)
Realtime của Supabase cần bảng thuộc publication `supabase_realtime`. Khi realtime chưa bật,
tính năng vẫn chạy nhờ fetch lúc mount + khi tab quay lại foreground. Bật bằng SQL:

```sql
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.periodic_reports;
```

(RLS SELECT đã tồn tại - các server query hiện đang hoạt động.)

## Ghi chú TDD
Repo chưa có test infra (không vitest/jest, package.json không có script test).
Verification thay thế: `tsc --noEmit` + `npm run lint` + `npm run build` + smoke test dev
(`/login` 200, `/mentor-app/notifications|tasks|home` 307 -> login guard đúng).

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Dev server: curl smoke các route.