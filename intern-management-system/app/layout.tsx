import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quản lý Thực tập - ĐH Đà Lạt",
    template: "%s | Quản lý Thực tập",
  },
  description:
    "Hệ thống quản lý thực tập sinh của trung tâm Công nghệ Thông tin",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} min-h-[100dvh] antialiased`}
    >
      <head />
      <body className="min-h-[100dvh]">{children}</body>
    </html>
  );
}