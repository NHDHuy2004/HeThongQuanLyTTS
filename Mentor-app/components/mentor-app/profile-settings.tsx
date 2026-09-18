'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BellSimpleRinging } from '@phosphor-icons/react/dist/ssr/BellSimpleRinging'
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen'
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { DeviceMobile } from '@phosphor-icons/react/dist/ssr/DeviceMobile'
import { Key } from '@phosphor-icons/react/dist/ssr/Key'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut'
import { User } from '@phosphor-icons/react/dist/ssr/User'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Drawer, DrawerContent, DrawerFooter, DrawerTitle } from '@/components/ui/drawer'
import { ThemeToggle } from '@/components/mentor-app/theme-toggle'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { changePassword, updateProfile } from '@/lib/actions/account'

interface ProfileSettingsProps {
  fullName: string
  email: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type SheetKey = null | 'profile' | 'password' | 'handbook' | 'policy'

const PUSH_KEY = 'mentor-app:push'

function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/60"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <CaretRight className="size-4 shrink-0 text-muted-foreground" weight="bold" />
    </button>
  )
}

export function ProfileSettings({ fullName, email }: ProfileSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()

  // ---- PWA install prompt ----
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
    setInstallPrompt(null)
  }

  // ---- Push notifications ----
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    let active = true
    async function init() {
      await Promise.resolve()
      if (!active) return
      const permission = Notification.permission
      setPushPermission(permission)
      if (permission === 'granted') {
        let stored = false
        try {
          stored = localStorage.getItem(PUSH_KEY) === 'on'
        } catch {
          // localStorage unavailable - default to off
        }
        setPushEnabled(stored)
      }
    }
    void init()
    return () => {
      active = false
    }
  }, [])

  async function handlePushToggle(checked: boolean) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (checked) {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission === 'granted') {
        setPushEnabled(true)
        try {
          localStorage.setItem(PUSH_KEY, 'on')
        } catch {
          // ignore
        }
      } else {
        toast('Cần cấp quyền thông báo để bật chức năng.', 'error')
      }
    } else {
      setPushEnabled(false)
      try {
        localStorage.setItem(PUSH_KEY, 'off')
      } catch {
        // ignore
      }
    }
  }

  const pushBlocked = pushPermission === 'unsupported' || pushPermission === 'denied'

  // ---- Sheets ----
  const [sheet, setSheet] = useState<SheetKey>(null)

  // ---- Profile edit ----
  const [name, setName] = useState(fullName)
  const [savingName, setSavingName] = useState(false)

  async function handleSaveName() {
    if (name.trim().length < 2) {
      toast('Họ tên tối thiểu 2 ký tự', 'error')
      return
    }
    setSavingName(true)
    const res = await updateProfile({ full_name: name })
    setSavingName(false)
    if (res.success) {
      toast('Đã cập nhật hồ sơ!')
      setSheet(null)
      router.refresh()
    } else {
      toast(res.error ?? 'Không thể cập nhật hồ sơ.', 'error')
    }
  }

  // ---- Change password ----
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleSavePassword() {
    if (newPassword.length < 6) {
      toast('Mật khẩu mới tối thiểu 6 ký tự', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Mật khẩu nhập lại không khớp', 'error')
      return
    }
    setSavingPassword(true)
    const res = await changePassword({ new_password: newPassword })
    setSavingPassword(false)
    if (res.success) {
      toast('Đã đổi mật khẩu thành công')
      setNewPassword('')
      setConfirmPassword('')
      setSheet(null)
    } else {
      toast(res.error ?? 'Không thể đổi mật khẩu.', 'error')
    }
  }

  // ---- Logout ----
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    } catch {
      setSigningOut(false)
      toast('Không thể đăng xuất. Vui lòng thử lại.', 'error')
    }
  }

  const drawerTitle =
    sheet === 'profile'
      ? 'Chỉnh sửa thông tin cá nhân'
      : sheet === 'password'
        ? 'Đổi mật khẩu'
        : sheet === 'handbook'
          ? 'Sổ tay Hướng dẫn Mentor'
          : sheet === 'policy'
            ? 'Chính sách & Bảo mật'
            : 'Cài đặt'

  return (
    <div className="flex flex-col pb-6">
      {/* Group: Application & Notifications */}
      <p className="px-1 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Cấu hình Ứng dụng &amp; Thông báo
      </p>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="divide-y divide-border/50">
          {/* PWA install */}
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <DeviceMobile className="size-5" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Cài đặt ứng dụng</p>
              <p className="text-xs text-muted-foreground">Thêm vào màn hình chính (HomeScreen)</p>
            </div>
            {canInstall ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleInstall()}
                className="h-9 shrink-0 rounded-xl text-xs font-medium"
              >
                Cài đặt
              </Button>
            ) : null}
          </div>

          {/* Push notifications */}
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <BellSimpleRinging className="size-5" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Thông báo đẩy</p>
              <p className="text-xs text-muted-foreground">Nhận tin khi sinh viên nộp task/báo cáo</p>
            </div>
            <Switch
              checked={pushEnabled}
              disabled={pushBlocked}
              onCheckedChange={(checked) => void handlePushToggle(checked)}
              aria-label="Bật tắt thông báo đẩy"
            />
          </div>

          {/* Dark mode */}
          <ThemeToggle />
        </div>
      </div>

      {/* Group: Account & System */}
      <p className="px-1 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Tài khoản &amp; Hệ thống
      </p>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="divide-y divide-border/50">
          <MenuRow
            icon={<User className="size-4" weight="bold" />}
            title="Chỉnh sửa thông tin cá nhân"
            onClick={() => setSheet('profile')}
          />
          <MenuRow
            icon={<Key className="size-4" weight="bold" />}
            title="Đổi mật khẩu"
            onClick={() => setSheet('password')}
          />
          <MenuRow
            icon={<BookOpen className="size-4" weight="bold" />}
            title="Sổ tay Hướng dẫn Mentor"
            onClick={() => setSheet('handbook')}
          />
          <MenuRow
            icon={<ShieldCheck className="size-4" weight="bold" />}
            title="Chính sách & Bảo mật"
            onClick={() => setSheet('policy')}
          />
        </div>
      </div>

      {/* Logout */}
      <div className="pt-6">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setLogoutOpen(true)}
          className="h-12 w-full rounded-2xl font-medium active:scale-[0.98]"
        >
          <SignOut className="size-5" weight="bold" />
          Đăng xuất
        </Button>
      </div>

      {/* Logout confirm */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogPopup>
          <div className="flex flex-col gap-1.5 text-center">
            <AlertDialogTitle>Đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </AlertDialogDescription>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <AlertDialogCancel disabled={signingOut}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Sheets */}
      <Drawer
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null)
        }}
      >
        <DrawerContent className="h-[85vh]">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
          <DrawerTitle className="sr-only">{drawerTitle}</DrawerTitle>

          <div
            data-vaul-no-drag
            className="flex-1 overflow-y-auto p-4 scrollbar-none"
          >
            {sheet === 'profile' && (
              <div>
                <p className="text-base font-bold tracking-tight">Chỉnh sửa thông tin cá nhân</p>
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-muted-foreground">
                  Họ và tên
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ và tên"
                  className="h-12 rounded-xl"
                />
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-muted-foreground">
                  Email
                </label>
                <Input value={email} disabled readOnly className="h-12 rounded-xl opacity-60" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Email là tài khoản đăng nhập và không thể chỉnh sửa.
                </p>
              </div>
            )}

            {sheet === 'password' && (
              <div>
                <p className="text-base font-bold tracking-tight">Đổi mật khẩu</p>
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-muted-foreground">
                  Mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="h-12 rounded-xl"
                />
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-muted-foreground">
                  Nhập lại mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhắc lại mật khẩu"
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            {sheet === 'handbook' && (
              <div>
                <p className="text-base font-bold tracking-tight">Sổ tay Hướng dẫn Mentor</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Quy trình giao task và đánh giá sinh viên:
                </p>
                <ol className="mt-4 space-y-4">
                  {[
                    {
                      title: 'Giao việc',
                      body: 'Bấm nút "Giao việc nhanh" ở giữa thanh điều hướng hoặc chọn "Giao task riêng" trong hồ sơ từng sinh viên.',
                    },
                    {
                      title: 'Theo dõi',
                      body: 'Theo dõi tiến độ thực hiện và trạng thái task trong tab Sinh viên.',
                    },
                    {
                      title: 'Nghiệm thu',
                      body: 'Duyệt bài nộp từ mục "Task cần nghiệm thu" trên Trang chủ hoặc theo từng sinh viên trong tab Sinh viên.',
                    },
                    {
                      title: 'Báo cáo định kỳ',
                      body: 'Phản hồi báo cáo tuần/đợt tại tab Báo cáo & Chấm công. Yêu cầu nộp lại nếu nội dung cần chỉnh sửa.',
                    },
                  ].map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {sheet === 'policy' && (
              <div>
                <p className="text-base font-bold tracking-tight">Chính sách & Bảo mật</p>
                <ul className="mt-4 space-y-3">
                  {[
                    'Dữ liệu cá nhân chỉ được dùng cho việc quản lý thực tập trong hệ thống.',
                    'Thông tin task, báo cáo chỉ hiển thị cho Mentor phụ trách và quản trị viên.',
                    'Luôn đăng xuất và khóa thiết bị khi rời khỏi máy dùng chung.',
                    'Liên hệ quản trị viên nếu phát hiện truy cập bất thường.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DrawerFooter className="shrink-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {sheet === 'profile' && (
              <Button
                onClick={() => void handleSaveName()}
                disabled={savingName}
                className="h-12 w-full rounded-xl"
              >
                {savingName ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            )}
            {sheet === 'password' && (
              <Button
                onClick={() => void handleSavePassword()}
                disabled={savingPassword}
                className="h-12 w-full rounded-xl"
              >
                {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}