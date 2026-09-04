import { ClipboardCheck, Clock3, FileCheck2, Users } from 'lucide-react'

const stats = [
  { label: 'Công việc đang mở', value: '0', icon: ClipboardCheck, color: 'text-sky-600 bg-sky-50' },
  { label: 'Giờ làm tuần này', value: '0h', icon: Clock3, color: 'text-teal-600 bg-teal-50' },
  { label: 'Đơn chờ duyệt', value: '0', icon: FileCheck2, color: 'text-amber-600 bg-amber-50' },
  { label: 'Thực tập sinh', value: '0', icon: Users, color: 'text-violet-600 bg-violet-50' },
]

export default function DashboardPage() {
  return <div className="mx-auto max-w-7xl space-y-8"><div><p className="text-sm font-medium text-sky-600">Thứ Sáu, 04 tháng 09, 2026</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Tổng quan</h1><p className="mt-1 text-sm text-slate-500">Theo dõi hoạt động thực tập sinh của bạn.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{stat.label}</p><span className={`rounded-lg p-2 ${stat.color}`}><Icon className="size-4" /></span></div><p className="mt-5 text-3xl font-semibold">{stat.value}</p></div> })}</section><section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="font-semibold">Chưa có hoạt động gần đây</h2><p className="mt-1 text-sm text-slate-500">Dữ liệu sẽ xuất hiện khi hệ thống được kết nối với Supabase.</p></section></div>
}