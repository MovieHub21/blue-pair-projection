// Availability only depends on these tables (see /api/public/availability and
// /api/public/room-calendar). RealtimeBridge broadcasts changes from every table,
// so availability views filter to these and coalesce bursts into one refetch.
const AVAILABILITY_TABLES = new Set(['rooms', 'room_daily_statuses', 'bookings'])

type ChangeDetail = { table: string | null; operation: string | null }

export function onAvailabilityChange(handler: (detail: ChangeDetail) => void, delayMs = 150) {
  let timer: number | null = null
  let last: ChangeDetail = { table: null, operation: null }

  const listener = (event: Event) => {
    const raw = ((event as CustomEvent).detail || {}) as { table?: unknown; operation?: unknown }
    const table = typeof raw.table === 'string' ? raw.table : null
    // Unknown table (missing payload) is treated as relevant so we never miss a change.
    if (table && !AVAILABILITY_TABLES.has(table)) return
    last = { table, operation: typeof raw.operation === 'string' ? raw.operation : null }
    if (timer !== null) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = null
      handler(last)
    }, delayMs)
  }

  window.addEventListener('bluepair:database-change', listener)
  return () => {
    window.removeEventListener('bluepair:database-change', listener)
    if (timer !== null) window.clearTimeout(timer)
  }
}
