# Design System - Struct Intern Management (taste-skill)

> Spec áp dụng `skills/taste-skill` (v2) + `redesign-skill` + `minimalist-skill` cho dashboard. Các rule marketing (hero, marquee, bento...) KHÔNG áp dụng cho admin UI (xem Section 13 taste-skill). Chỉ áp dụng các rule chung: color consistency lock, shape consistency lock, typography, icon family, motion, a11y, interactive states, em-dash ban.

## Design Read

"Quản lý app nội bộ (admin/mentor/intern), ngôn ngữ utilitarian minimalism pha chất xanh rừng thương hiệu DLU, shadcn/ui tùy chỉnh sâu."

## Dials

- `DESIGN_VARIANCE: 5` - layout chuẩn, nhịp rõ, không template-cũ.
- `MOTION_INTENSITY: 3` - chỉ hover/active feedback, không infinite-loop, không scroll-hijack.
- `VISUAL_DENSITY: 6` - dashboard data-heavy, dễ quét.

## Palette (DLU)

Một accent duy nhất: xanh lá đậm rừng (ĐH Đà Lạt). Vàng đất chỉ cho semantic warning + chi tiết logo.

| Token | Light | Dark | Ghi chú |
|---|---|---|---|
| `--background` | `oklch(0.985 0.006 155)` | `oklch(0.16 0.02 155)` | off-white / off-black, tint theo xanh |
| `--foreground` | `oklch(0.22 0.03 155)` | `oklch(0.96 0.008 155)` | |
| `--card` | `oklch(0.995 0.003 155)` | `oklch(0.20 0.025 155)` | |
| `--primary` | `oklch(0.42 0.11 155)` | `oklch(0.62 0.14 155)` | DLU xanh đậm |
| `--secondary` | `oklch(0.955 0.02 155)` | `oklch(0.26 0.03 155)` | |
| `--muted` | `oklch(0.952 0.014 155)` | `oklch(0.24 0.025 155)` | |
| `--accent` | `oklch(0.94 0.03 155)` | `oklch(0.27 0.04 155)` | chỉ dùng hover, không phải accent màu |
| `--destructive` | `oklch(0.585 0.24 26)` | `oklch(0.70 0.19 22)` | đỏ |
| `--destructive-foreground` | `oklch(0.985 0.005 155)` | `oklch(0.98 0.01 50)` | text trên nền destructive |
| `--warning` | `oklch(0.81 0.12 78)` | `oklch(0.79 0.12 75)` | vàng đất, semantic |
| `--warning-foreground` | `oklch(0.4 0.09 60)` | `oklch(0.2 0.05 70)` | |
| `--success` | `oklch(0.55 0.11 155)` | `oklch(0.68 0.11 155)` | xanh lá |
| `--success-foreground` | `oklch(0.99 0.005 155)` | `oklch(0.14 0.03 155)` | |
| `--border` | `oklch(0.91 0.012 155)` | `oklch(1 0 0 / 12%)` | |
| `--ring` | `oklch(0.42 0.11 155)` | `oklch(0.62 0.14 155)` | |
| `--radius` | `0.75rem` | | SHAPE LOCK |

Chart 1-5: dải xanh lá đậm -> nhạt (cùng hue 155), không pha màu lạ.

## Typography

- Sans: Geist (next/font), body `text-sm leading-relaxed`.
- Mono: Geist Mono cho số liệu, meta (uploads, dates, ids).
- Display: `tracking-tighter leading-none`.
- Số: `font-variant-numeric: tabular-nums` mọi chỗ hiển thị số liệu.
- `text-wrap: balance` cho heading dài.

## Shape

- Base radius `0.75rem` cho card/button/input (radii xl ~1rem cho container lớn hiếm khi dùng).
- Input nhỏ hơn: `--radius-md` = `calc(var(--radius) * 0.667)` (~0.5rem).
- KHÔNG `rounded-full` cho container lớn/button primary.

## Surface

- Card: `border border-border bg-card`, shadow tinted theo background hue, mức opacity thấp.
- Chỉ dùng card khi cần elevation thật; dạng list dùng `divide-y` + spacing.

## Interactive

- Button `:active`: `translate-y-[1px]` (đã có trong shadcn next).
- Focus ring: luôn hiện (`focus-visible:ring-2 ring-ring/...`).
- Loading: skeleton theo layout (không spinner chung nếu tránh được).
- Empty state: icon + hướng dẫn điền.
- Error: inline dưới input hoặc toast transient.

## Icon

- `@phosphor-icons/react`, weight `durable`/`bold`, size `1rem` trong UI nhỏ, `1.25rem` item chính.
- Không để sót `lucide-react`.

## Motion (dials 3)

- Chỉ transition hover/active: `transition duration-200`.
- Không infinite loop (bỏ `animate-pulse` trang trí).
- Không `window.addEventListener('scroll')`.

## A11y

- WCAG AA: body 4.5:1, large text 3:1 trên mọi CTA + form.
- Label trên input, placeholder không thay label.
- Dark mode đầy đủ, không `#000`/`#fff` thuần.

## Helper/điểm chốt

- `lib/session.ts`: `getSession()` (React `cache`) - lấy `{ user, profile }` dedupe giữa layout+page, dùng cho mọi trang dashboard. Không gọi `getUser()` thủ công.
- `lib/format.ts`: `formatTime`, `statusText`, `getMonday` dùng chung, không định nghĩa local.
- Route boundaries đã có: `(dashboard)/loading.tsx`, `(dashboard)/error.tsx`, `not-found.tsx`, `global-error.tsx` (Next 16: `error`/`retry` props).
- Icon: import per-icon `@phosphor-icons/react/dist/ssr/<Name>`, cấm barrel.