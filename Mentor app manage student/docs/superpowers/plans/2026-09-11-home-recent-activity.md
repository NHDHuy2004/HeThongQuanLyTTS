# Plan: Home - Hoat dong gan day thuc (Bước 8) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Màn Home hien tai phan "Hoat dong gan day" la EmptyState gia. Buoc nay thay bang feed thuc:
gom hoat dong tu 3 nguon (task / don xin nghi / bao cao dinh ky), sap xep theo thoi gian,
cap nhat live qua `NotificationsRealtime` (da co - chi can render them o Home).

## Phạm vi (actions)
- `app/mentor-app/home/page.tsx` (sua):
  - Fetch them: tasks (limit 10, status+submitted/completed/created), leave_requests (limit 5), periodic_reports (limit 5), moi select join profiles(full_name).
  - Build `Activity[]`: `{ id, type: 'task_action'|'request'|'report', title, subtitle, status, time }`:
    - task: `under_review` -> "Nop bai: <title>" (time submitted_at); `completed` -> "Duyet bai: <title>" (completed_at); nguoc lai -> "Giao viec: <title>" (created_at).
    - request: "Xin nghi phep" / "Xin WFH" cua <intern>, time created_at, status.
    - report: "Bao cao dinh ky (Ky N)", time submitted_at ?? created_at, status.
  - Sort theo time desc, slice 10.
  - Render trong SectionCard hien tai (thay EmptyState); giu EmptyState khi khong co hoat dong.
  - Icons: ClipboardText / CalendarCheck / FileText; badge `statusVariant`/`statusLabel`.
  - Render `<NotificationsRealtime userId internIds />` de feed tu lam moi khi co thay doi.

## Khong lam
- Khong dua activity vao trang profil/cai dat (buoc sau).
- Khong them nav/action tren tung item activity trong doi nay.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke test dev: `/login` 200, `/mentor-app/home` 307 -> login.