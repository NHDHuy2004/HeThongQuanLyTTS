# Plan: Students - bo loc trang thai (Bước 11) - Mentor App

Ngay: 2026-09-11
Trang thai: Dang trien khai

## Muc tieu
Them bo loc trang thai vao trang Sinh vien: "Tat ca / Dang thuc tap / Da hoan thanh"
 voi count badge. Giao dien chip-style tren cung, search o duoi, list o cuoi.
Khong thay doi server fetch, hoan toan client-side filter.

## Pham vi
- `components/mentor-app/student-list.tsx` (sua):
  - Them state `filter: 'all' | 'active' | 'completed'`.
  - Tinh count: `activeCount` (internship_status === 'active'),
    `completedCount` (=== 'completed_internship'), `total = interns.length`.
  - Render filter row (chips) phia tren input search:
    - Chip "Tat ca" (variant primary khi active), chip "Dang thuc tap", chip "Da hoan thanh".
    - Moi chip hien count badge nho ben trong.
  - Filter logic: `statusFilter(interns, filter)` chay truoc `searchFilter(q)`.
  - Khi filter thay doi, giu search query.

## Khong lam
- Khong them pagination (so luong intern mentor quan ly thuong < 20).
- Khong thay doi fetch server query.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`