# Plan: Chi tiet sinh vien + tim kiem (Bước 6) - Mentor App

Ngày: 2026-09-11
Trạng thái: Đang triển khai

## Mục tiêu
Tab Sinh vien hien tai: list tinh, search input `readOnly` (vo dung). Bước nay:
1. Search hoạt động (filter theo ten/email/truong), loc client-side.
2. Tap sinh vien -> BottomSheet chi tiet: header ho so, tien do thuc tap, stats (dang lam / hoan thanh / tre han / don cho duyet), danh sach task gan day, don gan day.

## Phạm vi (actions)
- `components/ui/skeleton.tsx` (mới) - `Skeleton` (animate-pulse bg-muted, rounded-lg) cho loading state.
- `components/mentor-app/student-detail-sheet.tsx` (mới) - client:
  - Export `InternSummary`. Props: `internId: string | null`, `intern: InternSummary | null`, `onClose`.
  - Header từ `intern` (instant): avatar, ten, email, university/major, tien do Progress, badge Xong.
  - `useEffect([internId, attempt])`: fetch client-side:
    - tasks cua intern (assignee_id), limit 50.
    - leave_requests cua intern, limit 10.
    - setDetail trong `.then` (async callback, khong vi pham set-state-in-effect).
  - Loading = skeleton khi `detail?.id !== internId`; error state + nut "Thu lai" (tang `attempt`).
  - StatCard grid (tai) 4 o: Dang lam, Hoan thanh, Tre han, Don cho duyet.
  - Recent tasks (5) - title + status badge; pending requests (3) - type pill + badge.
- `components/mentor-app/student-list.tsx` (mới) - client:
  - Props: `interns: InternSummary[]`. State `query`; filter bang useMemo (name/email/university/major).
  - Input search (khong readOnly) + cards (chuyen markup tu page, them `active:scale`), tap -> `activeId`.
  - Render `StudentDetailSheet`.
- `app/mentor-app/students/page.tsx` (sửa):
  - Bo Input readOnly + `MagnifyingGlass` import; select giu nguyen; neu rong -> EmptyState, nguoc lai `<StudentList interns={...} />`.

## Khong lam
- Khong them trang bat buoc rieng; detail dung sheet.
- Khong fetch report/evaluation trong sheet (bo sung sau).

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke test dev: `/login` 200, `/mentor-app/students` 307 -> login.