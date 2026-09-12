export function naira(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime()
  const b = new Date(checkOut).getTime()
  return Math.max(1, Math.round((b - a) / 86400000))
}

/** Today in Lagos time as YYYY-MM-DD — used everywhere instead of fixed dates. */
export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
}

/** A date a given number of days from today (Lagos time), as YYYY-MM-DD. */
export function addDaysISO(days: number, from: string = todayISO()): string {
  const d = new Date(from + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

/** Full date + time, for invoices and receipts. */
export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value.length === 10 ? value + 'T00:00:00' : value) : value
  return d.toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos',
  })
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
