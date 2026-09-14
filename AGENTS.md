# AGENTS.md - Intern Management System (HeThongQuanLyTTS)

Dự án: Hệ thống quản lý thực tập sinh, Next.js App Router + Supabase + shadcn/ui + Tailwind v4.

Source quy tắc được giữ tại `skills/`:

- `skills/taste-skill/` - bộ rule thiết kế frontend (anti-slop, taste-skill/redesign-skill/minimalist-skill).
- `skills/superpowers/` - bộ phương pháp phát triển (brainstorming, writing-plans, test-driven-development, requesting-code-review, verification-before-completion ...).

## Quy trình làm việc (superpowers)

1. **Brainstorming trước khi code**: đọc brief, đọc "Design Read" một dòng (page kind / audience / vibe / design system), đặt dials. Không nhảy vào code.
2. **writing-plans**: với task nhiều bước, ghi plan xuống `docs/superpowers/plans/YYYY-MM-DD-<name>.md` trước khi sửa code.
3. **test-driven-development**: RED -> GREEN -> REFACTOR. Viết test trước, xác nhận test fail, rồi code, xác nhận pass.
4. **requesting-code-review**: tự review trước khi báo "xong", phân theo severity. Critical chặn tiến độ.
5. **verification-before-completion**: KHÔNG báo hoàn thành khi chưa xác minh (lint, build, chạy thử). Bằng chứng > lời khẳng định.

## Design system đã chốt (taste-skill, áp dụng cho dashboard)

- **Design Read**: "Quản lý app nội bộ (admin/mentor/intern), ngôn ngữ utilitarian minimalism pha chất xanh rừng thương hiệu DLU, shadcn/ui tùy chỉnh sâu."
- **Dials**: DESIGN_VARIANCE 5 / MOTION_INTENSITY 3 / VISUAL_DENSITY 6.
- **Màu chủ đạo ĐH Đà Lạt**: xanh lá đậm (rừng) là ACCENT DUY NHẤT. Vàng đất/ochre chỉ dùng cho semantic (cảnh báo) và chi tiết logo nhỏ, không phải accent thứ hai.
  - Primary (DLU xanh đậm), neutral tint theo xanh, destructive đỏ, warning vàng đất, success xanh lá.
  - Một palette cho toàn bộ dự án: KHÔNG pha trộn gray warm/cool. Saturation accent < 80%.
- **SHAPE LOCK**: một hệ corner-radius (base ~0.75rem). Button/card/input cùng ngôn ngữ, không pha `rounded-full` cho container lớn.
- **Em-dash BAN**: cấm `—` và `–` ở mọi text hiển thị (headline, badge, button, body). Chỉ dùng hyphen `-`.
- **Icon family**: `@phosphor-icons/react` (weight bold/durable), MỘT family duy nhất, không trộn với lucide. Cấm hand-rolled SVG.
- **Typography**: Geist Sans + Geist Mono qua `next/font`. Display `tracking-tighter leading-none`. Số liệu dùng `font-variant-numeric: tabular-nums`. Cấm serif cho dashboard.
- **Component states**: loading (skeleton), empty (có hướng dẫn điền), error (inline/contextual). Button `:active` co nhẹ (`scale`/`translate-y`). Focus ring luôn hiện.
- **Tương phản bắt buộc**: WCAG AA (4.5:1 body, 3:1 chữ lớn). Kiểm tra mọi CTA và form.
- **Motion**: min (dials 3) - chỉ hover/active, không infinite-loop. Không scroll-listener thuần JS.
- **Dark mode**: dùng CSS vars oklch, giữ hierarchy + contrast ở cả 2 mode, không `#000`/`#fff` thuần.
- **Cấm decorative dots**: chấm màu trang trí không được dùng; chấm chỉ khi mang ý nghĩa state thật.
- **Bỏ emoji khỏi UI**; thay bằng icon.

## Kiến trúc

- Server Components mặc định. Chỉ những component có state/event mới thêm `'use client'` (leaf component).
- Container dùng `max-w-[1400px] mx-auto` (page) và `min-h-[100dvh]` (full-height, không bao giờ `h-screen`).
- Grid, không flex-math phức (`w-[calc(...)]` cấm); mobile collapse khai báo tường minh.
- Trước khi import thư viện mới, kiểm tra `package.json`.