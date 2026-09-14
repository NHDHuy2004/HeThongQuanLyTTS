'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { type ActionResult, OK, fail } from '@/lib/action-utils'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function uploadDocument(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return fail('Vui lòng chọn file.')
  if (file.size > 10 * 1024 * 1024) return fail('File không được vượt quá 10MB.')
  if (!ALLOWED_TYPES.includes(file.type)) return fail('Chỉ hỗ trợ PDF và Word.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Bạn cần đăng nhập để upload.')

  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return fail('Không thể upload file.')

  revalidatePath('/intern/documents')
  return OK
}

const downloadSchema = z.object({
  path: z.string().min(1).max(500),
})

export type DownloadResult = { url: string } | { error: string }

export async function getDocumentUrl(path: string): Promise<DownloadResult> {
  const parsed = downloadSchema.safeParse({ path })
  if (!parsed.success) return { error: 'Đường dẫn tài liệu không hợp lệ.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn cần đăng nhập để tải tài liệu.' }

  const { data: actor } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!actor) return { error: 'Không tìm thấy tài khoản của bạn.' }

  const ownerId = parsed.data.path.split('/')[0]
  if (!ownerId) return { error: 'Đường dẫn tài liệu không hợp lệ.' }

  const isOwnDocument = ownerId === user.id
  const isStaff = actor.role === 'mentor' || actor.role === 'admin'

  if (!isOwnDocument && !isStaff) {
    return { error: 'Bạn không có quyền truy cập tài liệu này.' }
  }

  if (!isOwnDocument && actor.role === 'mentor') {
    const { data: intern } = await supabase
      .from('profiles')
      .select('mentor_id')
      .eq('id', ownerId)
      .maybeSingle()
    if (!intern || intern.mentor_id !== user.id) {
      return { error: 'Bạn chỉ có thể truy cập tài liệu của thực tập sinh do mình hướng dẫn.' }
    }
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(parsed.data.path, 60)
  if (error) return { error: 'Không thể tạo liên kết tải xuống.' }
  if (!data?.signedUrl) return { error: 'Không thể tạo liên kết tải xuống.' }

  return { url: data.signedUrl }
}