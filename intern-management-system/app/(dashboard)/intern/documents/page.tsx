import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { FolderOpen } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderUser } from '@phosphor-icons/react/dist/ssr/FolderUser'
import { PageHeader } from '@/components/page/page-header'
import { SectionCard, SectionHeader } from '@/components/page/section-card'
import { EmptyState } from '@/components/page/empty-state'
import { DocumentUpload } from '@/components/interns/document-upload'
import { DocumentDownloadLink } from '@/components/interns/document-download'

type StorageFile = {
  id: string
  name: string
  metadata?: { size?: number } | null
}

async function listFolder(supabase: Awaited<ReturnType<typeof createClient>>, folderId: string): Promise<StorageFile[]> {
  const { data } = await supabase.storage
    .from('documents')
    .list(folderId, { sortBy: { column: 'created_at', order: 'desc' } })
  return (data ?? []) as StorageFile[]
}

function FlattenedFileList({ ownerId, files }: { ownerId: string; files: StorageFile[] }) {
  if (!files.length) {
    return <p className="p-5 text-xs text-muted-foreground">Chưa có tài liệu trong thư mục này.</p>
  }
  return (
    <div className="divide-y divide-border">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-4 shrink-0 text-primary" weight="bold" />
            <span className="truncate text-sm font-medium">{file.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {file.metadata?.size ? `${Math.ceil(file.metadata.size / 1024)} KB` : ''}
            </span>
            <DocumentDownloadLink path={`${ownerId}/${file.name}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { user, profile } = await getSession()
  if (!user || !profile) return null

  const role = profile.role
  const isMentor = role === 'mentor'

  const myFiles = await listFolder(supabase, user.id)

  let internsWithFiles: Array<{ id: string; full_name: string; files: StorageFile[] }> = []
  if (isMentor) {
    const { data: interns } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('mentor_id', user.id)
      .eq('role', 'intern')
      .order('full_name')

    if (interns) {
      const withFiles = await Promise.all(
        interns.map(async (intern) => ({
          id: intern.id,
          full_name: intern.full_name,
          files: await listFolder(supabase, intern.id),
        })),
      )
      internsWithFiles = withFiles
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isMentor ? 'Kho tài liệu & Báo cáo' : 'Tài liệu & Báo cáo thực tập'}
        description={
          isMentor
            ? 'Quản lý tài liệu cá nhân và duyệt báo cáo do thực tập sinh nộp.'
            : role === 'intern'
              ? 'Tải lên CV, đề cương và báo cáo định kỳ nộp cho Mentor.'
              : 'Lưu trữ các văn bản, hướng dẫn quy chuẩn và hồ sơ thực tập.'
        }
      />

      <SectionCard>
        <SectionHeader
          title="Tải lên tài liệu mới"
          icon={FolderOpen}
          description="Định dạng hỗ trợ: PDF, Word (.doc, .docx). Tối đa 10MB."
        />
        <DocumentUpload />
      </SectionCard>

      <SectionCard>
        <SectionHeader
          title="Tài liệu cá nhân"
          icon={FolderOpen}
          action={<span className="text-xs text-muted-foreground tabular-nums">{myFiles.length} tệp</span>}
        />
        {myFiles.length ? (
          <FlattenedFileList ownerId={user.id} files={myFiles} />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Chưa có tài liệu nào"
            description="Tài liệu tải lên sẽ xuất hiện ở đây."
          />
        )}
      </SectionCard>

      {isMentor && (
        <SectionCard>
          <SectionHeader
            title="Báo cáo của Thực tập sinh"
            icon={FolderUser}
            description="Tài liệu do các thực tập sinh bạn hướng dẫn tải lên."
          />
          {internsWithFiles.length ? (
            <div className="divide-y divide-border">
              {internsWithFiles.map((intern) => (
                <div key={intern.id} className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    {intern.full_name}
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                      {intern.files.length} tệp
                    </span>
                  </h3>
                  {intern.files.length ? (
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {intern.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FileText className="size-3.5 shrink-0 text-primary" weight="bold" />
                            <span className="truncate text-sm">{file.name}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2.5">
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                              {file.metadata?.size ? `${Math.ceil(file.metadata.size / 1024)} KB` : ''}
                            </span>
                            <DocumentDownloadLink path={`${intern.id}/${file.name}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Thực tập sinh này chưa nộp tài liệu nào.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderUser}
              title="Chưa có thực tập sinh phụ trách"
              description="Khi bạn được phân công thực tập sinh, báo cáo của họ sẽ xuất hiện tại đây."
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}