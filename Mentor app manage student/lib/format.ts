export function formatTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}

export function statusText(status: string) {
  return status === 'present' ? 'Có mặt' : status === 'late' ? 'Đi trễ' : status === 'absent' ? 'Vắng mặt' : status === 'wfh' ? 'WFH' : status
}

const VN_TZ = 'Asia/Ho_Chi_Minh'

export function toVietnamDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function todayInVietnam(): string {
  return toVietnamDate(new Date())
}

const VN_OFFSET = '+07:00'

/** Converts a naive local datetime (from <input type="datetime-local">) to ISO-8601 at UTC (VN +07:00, no DST). */
export function fromDateTimeLocal(value: string): string {
  if (!value) return ''
  return new Date(`${value}:00${VN_OFFSET}`).toISOString()
}

/** Converts a YYYY-MM-DD date to an ISO deadline at end of day in Vietnam. */
export function fromDateOnly(value: string): string {
  if (!value) return ''
  return new Date(`${value}T23:59:59${VN_OFFSET}`).toISOString()
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Vua xong'
  if (diffMin < 60) return `${diffMin} phut truoc`
  if (diffHour < 24) return `${diffHour} gio truoc`
  if (diffDay < 7) return `${diffDay} ngay truoc`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const a = new Date(ys, ms - 1, ds)
  const b = new Date(ye, me - 1, de)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function internshipProgress(
  start: string | null,
  end: string | null,
  today = new Date(),
): { elapsed: number; total: number; percent: number } | null {
  if (!start || !end) return null
  const total = daysBetween(start, end)
  if (total <= 0) return null
  const elapsed = Math.max(0, Math.min(daysBetween(start, toVietnamDate(today)), total))
  return { elapsed, total, percent: Math.round((elapsed / total) * 100) }
}
