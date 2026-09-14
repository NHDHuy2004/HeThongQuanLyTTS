export function formatTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
}
export function statusText(status: string) {
  return status === 'present' ? 'Có mặt' : status === 'late' ? 'Đi trễ' : status === 'absent' ? 'Vắng mặt' : status === 'wfh' ? 'WFH' : status
}
export function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
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

export function mondayOfVietnamWeek(date: Date): string {
  const [year, month, day] = toVietnamDate(date).split('-').map(Number)
  const dayIndex = new Date(year, month - 1, day).getDay()
  const diff = day - dayIndex + (dayIndex === 0 ? -6 : 1)
  const monday = new Date(year, month - 1, diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

const VN_OFFSET = '+07:00'

/**
 * Converts a naive local datetime (from <input type="datetime-local">, which
 * represents Vietnam wall-clock time) into an ISO-8601 string at UTC.
 * Vietnam has no DST, so the offset is a fixed +07:00.
 */
export function fromDateTimeLocal(value: string): string {
  if (!value) return ''
  return new Date(`${value}:00${VN_OFFSET}`).toISOString()
}

/** Formats an ISO-8601 instant as a datetime-local value in Vietnam time. */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/**
 * Số tuần thực tập tính từ ngày bắt đầu (profile.created_at) đến hôm nay,
 * theo tuần bắt đầu từ thứ Hai, múi giờ Việt Nam.
 */
export function weekNumberOfInternship(startIso: string, today = new Date()): number {
  const mondayStart = new Date(`${mondayOfVietnamWeek(new Date(startIso))}T00:00:00`)
  const mondayToday = new Date(`${mondayOfVietnamWeek(today)}T00:00:00`)
  const diffDays = (mondayToday.getTime() - mondayStart.getTime()) / 86400000
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}

/** Cộng thêm số ngày vào một ngày dạng YYYY-MM-DD, trả về chuỗi YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Số ngày chênh lệch giữa hai ngày YYYY-MM-DD (b - a). */
export function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const a = new Date(ys, ms - 1, ds)
  const b = new Date(ye, me - 1, de)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

/** Tiến độ thực tập (ngày đã qua / tổng ngày), theo thời điểm hôm nay. */
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

/** Chuỗi ngày đến hạn của các đợt báo cáo định kỳ trong khoảng thời gian thực tập. */
export function generatePeriodicDueDates(start: string, end: string, intervalDays: number): string[] {
  const dates: string[] = []
  let due = start
  let guard = 0
  while (due <= end && guard < 520) {
    dates.push(due)
    due = addDays(due, intervalDays)
    guard++
  }
  return dates
}