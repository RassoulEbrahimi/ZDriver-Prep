const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function fa(n: number | string): string {
  return String(n).replace(/\d/g, d => FA_DIGITS[Number(d)])
}

export function formatTime(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${fa(mm)}:${fa(ss)}`
}
