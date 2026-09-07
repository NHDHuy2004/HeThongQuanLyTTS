'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadDocument(formData: FormData) {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) throw new Error('Vui lòng chọn file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('File không được vượt quá 10MB.')
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) throw new Error('Chỉ hỗ trợ PDF và Word.')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập để upload.')
  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Không thể upload file.')
  revalidatePath('/intern/documents')
}