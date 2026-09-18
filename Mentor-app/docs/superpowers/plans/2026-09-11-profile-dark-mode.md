# Plan: Ca nhan & che do toi (Bước 9) - Mentor App

Ngay: 2026-09-11
Trang thai: Dang trien khai

## Muc tieu
Lam trang "Ca nhan" thanh man giao dien hoan chinh: the hien ho so mentor (phong ban, so
thuc tap sinh dang quan ly, ngay tham gia), bo sung toggle che do toi/sang dung scheme hien
co của globals.css (class `.dark` + CSS vars oklch da co, chua co UI de bat).

## Pham vi
1. Theme bootstrap: them inline <script> trong <head> cua root layout de doc localStorage /
   prefers-color-scheme, them/tat class .dark TRUOC khi hydrate (khong FOUC).
2. `components/mentor-app/theme-toggle.tsx` (client): dung `useSyncExternalStore` (lint-safe,
   hydration-safe) de doc class cua <html>; click thi toggle class + luu localStorage.
   Row giao dien theo design system (Sun/Moon, nhan "Che do toi", trang thai Bat/Tat).
   Khong dung library moi.
3. `app/globals.css`: them `color-scheme` (light/dark) cho form control & scrollbar than thien.
4. `app/mentor-app/profile/page.tsx` (server): 
   - Card ho so: avatar + ten + email + chip "Mentor".
   - Strip 2 thong ke: so thuc tap sinh (count profiles role=intern [+ mentor_id neu role mentor]) + phong ban (join departments theo department_id).
   - Section "Cau hinh": ThemeToggle row.
   - Section "Tai khoan": email + ngay tham gia (created_at) - dong co icon.
   - Logout + footer ver 0.1.0.

## Khong lam
- Khong dem thu vien moi vao (e.g. next-themes).
- Khong lam toggle o header toan app trong lan nay.

## Verification steps
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Smoke: `/login` 200, `/mentor-app/profile` 307; kiem tra bang mat khong co FOUC khi refesh (dark kept).