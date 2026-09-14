# Mentor App - Quan ly thuc tap sinh

Ung dung di dong (mobile-first) danh cho **Mentor** quan ly thuc tap sinh cua DLU.
Xay dung bang Next.js 16 (App Router), Supabase, Tailwind CSS v4, shadcn/ui, Phosphor Icons.

## Tinh nang

- **Trang chu**: thong ke (viec tre han, don cho duyet, bao cao) + feed hoat dong gan day (task, don, bao cao) cap nhat realtime.
- **Sinh vien**: danh sach + tim kiem + bo loc trang thai (dang thuc tap / da hoan thanh); ho so chi tiet moi sinh vien (tien do, viec, don xin nghi, bao cao dinh ky).
- **Viec can lam**: tao viec (FAB, chon nhieu sinh vien, phan loai, do uu tien, han chot), duyet bai nop (duyet / tra lai kem ghi chu), tim kiem theo ten/phan loai/sinh vien.
- **Thong bao**: feed hop nhat don xin nghi + viec cho duyet + bao cao cho phan hoi; badge so bao chua xu ly; realtime qua Supabase.
- **Ca nhan**: ho so mentor (phong ban, so thuc tap sinh), che do toi/sang, dang xuat.

## Yeu cau

- Node.js 20+
- Supabase project co san schema (bang `profiles`, `departments`, `tasks`, `leave_requests`, `periodic_reports`...)

## Cai dat

```bash
cp .env.example .env.local
# dien NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Mo `http://localhost:3000`, dang nhap bang tai khoan co `role = 'mentor'`.

## Battery nho

- Neu `profiles.role = 'mentor'`: sau khi dang nhap se vao `/mentor-app/home`. Cac route khac
  (`/admin`, `/intern`) danh cho role tuong ung cung thuoc cung project.
- `mentor_app` chi phan quyen truy cap cac du lieu thuoc mentor (intern, task, don, bao cao).
- **Bat buco**: dao file `supabase/migrations/2026-09-11-rls-complete.sql` len **Supabase SQL Editor**
  va chay (an toan chay lai). File nay gui:
  - RLS + policy cho tat ca bang cong khai (`profiles`, `departments`, `tasks`, `periodic_reports`,
    `leave_requests`, `attendance`, `evaluations`, `final_evaluations`) theo mo hinh
    `admin` toan quyen / `mentor` chi du lieu sinh vien duoc giao / `intern` chi du lieu cua minh.
  - Helper ham `security definer` (`current_user_role`, `is_admin`, `is_mentor_of`, `get_my_mentor_id`),
    trigger `handle_new_user` (tu tao profile khi dang ky), trigger chong leo quyen (khong tu doi
    `role`/`mentor_id`), trigger chong intern sua `mentor_feedback`, trigger `updated_at`.
  - Realtime publication cho `tasks`, `leave_requests`, `periodic_reports`, `attendance` (idempotent).

  Neu chua chay realtime, app van hoat dong binh thuong (fallback: fetch khi mo + khi quay lai tab).
  Nen chay ca migration `2026-09-10-periodic-reports-and-final-evaluations.sql` truoc (o repo
  `intern-management-system/supabase/migrations/`) de co cac bang hai thuoc nay.

## Deploy (Vercel)

1. Push repo len GitHub / Vercel Git integration.
2. Import project, bam `npm run build` (default Next.js preset, khong can config).
3. Them env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Root page se chuyen ve `/login`.

## Scripts

| lenh           | mo ta            |
| -------------- | ---------------- |
| `npm run dev`  | dev server       |
| `npm run build`| production build |
| `npm run start`| serve build      |
| `npm run lint` | eslint           |

## Ghi chu bao mat

- `anon_key` duoc phen `NEXT_PUBLIC_` vi no chi ho tro truy cap du lieu thong qua RLS.
- Rule an toan quan trong (bao mat): chi tao duoc tu khoa anon, không ghi loi tiep thu doc:
  moi bang quan trong deu can `ENABLE ROW LEVEL SECURITY` + policy phan quyen theo `role`.