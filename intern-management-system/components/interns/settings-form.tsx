'use client'

import { useEffect } from 'react'
import { useActionState } from 'react'
import { updateProfile } from '@/app/(dashboard)/intern/settings/actions'
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { ActionResult } from '@/lib/action-utils'

const roleLabels = {
  admin: 'Quản trị viên (Admin)',
  mentor: 'Người hướng dẫn (Mentor)',
  intern: 'Thực tập sinh (Intern)',
} as const

const roleBadgeVariant = {
  admin: 'danger' as const,
  mentor: 'success' as const,
  intern: 'primary' as const,
}

const initialState: ActionResult = { success: false }

export function SettingsForm({
  fullName,
  email,
  university,
  major,
  avatarUrl,
  role,
}: {
  fullName: string
  email: string
  university: string
  major: string
  avatarUrl: string
  role: 'admin' | 'mentor' | 'intern'
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.success) {
      toast('Đã cập nhật hồ sơ!')
    } else if (state.error) {
      toast(state.error, 'error')
    }
  }, [state, toast])

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gear className="size-5 text-primary" weight="bold" />
            <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
          </div>
          <CardDescription>Các trường bắt buộc được đánh dấu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                Họ và tên
              </label>
              <Input id="full_name" name="full_name" defaultValue={fullName} required placeholder="Nhập họ và tên" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email tài khoản
              </label>
              <Input id="email" value={email} disabled placeholder="Email" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="university" className="text-xs font-semibold text-foreground">
                Trường đại học
              </label>
              <Input id="university" name="university" defaultValue={university} placeholder="Đại học Đà Lạt" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="major" className="text-xs font-semibold text-foreground">
                Chuyên ngành đào tạo
              </label>
              <Input id="major" name="major" defaultValue={major} placeholder="Công nghệ thông tin" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="avatar_url" className="text-xs font-semibold text-foreground">
                Đường dẫn ảnh đại diện (Avatar URL)
              </label>
              <Input id="avatar_url" name="avatar_url" type="url" defaultValue={avatarUrl} placeholder="https://..." />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Phân quyền tài khoản:</span>
              <Badge variant={roleBadgeVariant[role]}>{roleLabels[role]}</Badge>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}