import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { uploadDocument } from '@/app/(dashboard)/dashboard/documents/actions'
import { Button } from '@/components/ui/button'
import { FolderOpen, UploadCloud, FileText } from 'lucide-react'

export default async function AdminDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${profile?.role ?? 'login'}`)

  const { data: files } = await supabase.storage
    .from('documents')
    .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Quản trị hệ thống</p>
        <h1 className="text-2xl font-semibold tracking-tight">Kho lưu trữ tài liệu hệ thống</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lưu trữ các văn bản quy chuẩn, biểu mẫu và tài liệu đào tạo của trường.
        </p>
      </div>

      <form
        action={uploadDocument}
        className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tải lên tệp tài liệu mới</p>
            <p className="text-xs text-slate-500">Định dạng hỗ trợ: PDF, Word (.doc, .docx). Tối đa 10MB.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="file"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="text-xs file:mr-2.5 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-medium dark:file:bg-slate-800 dark:file:text-slate-200"
          />
          <Button type="submit" size="sm" className="bg-rose-700 hover:bg-rose-800 text-white">
            Tải lên
          </Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderOpen className="size-4 text-emerald-600" /> Danh sách tệp tài liệu
          </h2>
          <span className="text-xs text-slate-500">{files?.length ?? 0} tệp</span>
        </div>

        {files?.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="size-4 shrink-0 text-emerald-600" />
                  <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</span>
                </div>
                <span className="shrink-0 text-xs text-slate-400 font-mono">
                  {file.metadata?.size ? `${Math.ceil(file.metadata.size / 1024)} KB` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            Chưa có tài liệu nào trong thư mục của bạn.
          </div>
        )}
      </section>
    </div>
  )
}
