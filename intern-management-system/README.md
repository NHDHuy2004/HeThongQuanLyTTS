# Intern Management System - Hệ thống Quản lý Thực tập sinh

Hệ thống quản lý thực tập sinh cho Trung tâm Công nghệ Thông tin, xây dựng với **Next.js App Router**, **Supabase** và **Shadcn UI**.

## Vai trò

- **Admin:** Toàn quyền CRUD, quản lý phòng ban/đơn vị, phân quyền tài khoản, chỉ định Mentor, xem thống kê tổng quan.
- **Mentor:** Giao task, duyệt kết quả, nhận báo cáo tuần và ghi nhận xét, duyệt đơn nghỉ, đánh giá Intern.
- **Intern:** Xác nhận task, cập nhật tiến độ, nộp kết quả, nộp báo cáo tuần, check-in/out, xin nghỉ phép.

## Task workflow

`pending_acceptance` (chờ xác nhận) -> `in_progress` (đang thực hiện) -> `under_review` (chờ duyệt) -> `completed` (hoàn thành) / `rejected` (từ chối).

Khi task đạt `completed`, hệ thống tự so sánh `completed_at` với `deadline` để gán `completion_status` = `on_time` (Đúng hạn, badge xanh) hoặc `late` (Trễ hạn, badge đỏ).

## Chạy local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local`.

## Cài đặt cơ sở dữ liệu (Supabase)

1. Với database **mới**: mở Supabase Dashboard > SQL Editor và chạy [supabase/schema.sql](supabase/schema.sql) (tạo toàn bộ bảng, enum, RLS, trigger, storage, realtime, seed).
2. Với database **đã có**: chạy file migration trong [supabase/migrations](supabase/migrations) để nâng cấp lên task workflow 5 trạng thái và bảng `weekly_reports`.

Admin đầu tiên được bootstrap qua email `nhdhuy1109@gmail.com` (có thể chỉnh dòng cuối `schema.sql`).

## Realtime

Bật publication `supabase_realtime` cho các bảng `tasks`, `leave_requests`, `weekly_reports` (schema.sql đã tự đăng ký). Header dashboard hiển thị chuông thông báo khi có task mới, đơn nghỉ được duyệt hoặc báo cáo tuần mới.

## Deploy GitHub và Vercel

**1. Đẩy lên GitHub:**

```bash
git init
git add .
git commit -m "Initialize intern management system"
git branch -M main
git remote add origin https://github.com/<account>/<repository>.git
git push -u origin main
```

**2. Vercel:**

1. Vào [vercel.com/new](https://vercel.com/new), import repository GitHub.
2. Framework preset: **Next.js** (Vercel tự nhận diện).
3. Thêm hai biến môi trường cho Production, Preview và Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Mỗi lần push lên GitHub sẽ tạo deployment tự động.

**Lưu ý production:** Biến môi trường phải trỏ đúng project Supabase; endpoint anon key dùng chung cho local và production. Không khai báo secret/service role key ở client.