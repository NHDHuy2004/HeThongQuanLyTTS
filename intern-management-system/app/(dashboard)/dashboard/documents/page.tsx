import { createClient } from '@/lib/supabase/server'
import { uploadDocument } from './actions'
import { Button } from '@/components/ui/button'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: files } = await supabase.storage.from('documents').list(user.id, { sortBy: { column: 'created_at', order: 'desc' } })
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Kho lưu trữ</p><h1 className="text-2xl font-semibold tracking-tight">Tài liệu</h1><p className="mt-1 text-sm text-slate-500">Lưu trữ CV, báo cáo và tài liệu đào tạo.</p></div><form action={uploadDocument} className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center"><input name="file" type="file" accept=".pdf,.doc,.docx" required className="text-sm" /><Button type="submit">Upload tài liệu</Button></form><section className="divide-y rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">{files?.map((file) => <div key={file.id} className="flex items-center justify-between gap-3 p-4"><span className="truncate text-sm">{file.name}</span><span className="shrink-0 text-xs text-slate-500">{file.metadata?.size ? `${Math.ceil(file.metadata.size / 1024)} KB` : ''}</span></div>)}{!files?.length && <p className="p-6 text-sm text-slate-500">Chưa có tài liệu.</p>}</section></div>
}