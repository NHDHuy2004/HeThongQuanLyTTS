# Intern Management System

Hệ thống quản lý thực tập sinh xây dựng với Next.js App Router, Supabase và Shadcn UI.

## Chạy local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Điền hai biến Supabase trong `.env.local`, sau đó chạy [supabase/schema.sql](supabase/schema.sql) trên Supabase SQL Editor.

## Realtime

Trong Supabase Dashboard, vào **Database > Publications > supabase_realtime** và bật bảng `tasks`, `leave_requests`. Header dashboard sẽ nhận bản ghi mới/cập nhật theo thời gian thực.

## Deploy GitHub và Vercel

```bash
git init
git add .
git commit -m "Initialize intern management system"
git branch -M main
git remote add origin https://github.com/<account>/<repository>.git
git push -u origin main
```

Trên Vercel, import repository GitHub và thêm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` cho Production, Preview và Development. Mỗi lần push vào GitHub sẽ tạo deployment tự động.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
