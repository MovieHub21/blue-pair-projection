import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Bounded data loading for admin pages.
 *
 * The admin pages used to download whole tables (every booking, payment and customer ever recorded)
 * and filter them in the browser. Supabase also silently stops at 1000 rows per request, so on a
 * busy hotel those pages were both slow and, past 1000 rows, quietly incomplete. The helpers below
 * ask the database only for the rows a page can actually show or count.
 */

const PAGE_SIZE = 1000
const MAX_PAGES = 20

export function shiftISODate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

type Rows = { data: any[] | null; error: any }

/** Reads every row matching a query, one request per 1000 rows (a fresh query is built for each page). */
async function fetchAllPages(build: () => any): Promise<Rows> {
  const all: any[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await build().range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (error) return { data: null, error }
    all.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return { data: all, error: null }
}

/**
 * Everything the admin dashboard needs for the chosen period, and nothing else.
 * - bookings: created / checking in / checking out within the period, plus anything still pending or
 *   checked in (the dashboard counts those regardless of date). The created_at window is one day wider
 *   on each side so time-zone differences can never drop a row; the page still applies its exact rules.
 * - payments: successful payments inside the period.
 * - maintenance tickets / guest requests: only the ones that are still open.
 * - customers: just the total count.
 */
export async function fetchDashboardRows(db: SupabaseClient, rangeStart: string, today: string) {
  const createdFrom = shiftISODate(rangeStart, -1)
  const createdBefore = shiftISODate(today, 2)
  const bookingFilter = [
    `and(created_at.gte.${createdFrom},created_at.lt.${createdBefore})`,
    `and(check_in.gte.${rangeStart},check_in.lte.${today})`,
    `and(check_out.gte.${rangeStart},check_out.lte.${today})`,
    'status.in.(pending,checked_in)',
  ].join(',')

  const [rm, bk, cu, pay, mt, gr] = await Promise.all([
    db.from('rooms').select('*').order('room_number'),
    fetchAllPages(() => db.from('bookings').select('*').or(bookingFilter).order('created_at', { ascending: false }).order('id')),
    db.from('customers').select('id', { count: 'exact', head: true }),
    fetchAllPages(() => db.from('payments').select('*').eq('status', 'success').gte('date', rangeStart).lte('date', today).order('date', { ascending: false }).order('id')),
    fetchAllPages(() => db.from('maintenance_tickets').select('*').or('status.is.null,status.not.in.(resolved,closed,completed)').order('date_reported', { ascending: false }).order('id')),
    fetchAllPages(() => db.from('guest_requests').select('*').or('status.is.null,status.not.in.(resolved,completed,closed)').order('created_at', { ascending: false }).order('id')),
  ])
  return { rm, bk, cu, pay, mt, gr }
}

/** Removes characters that have a special meaning inside a PostgREST filter or a LIKE pattern. */
export function sanitizeSearchTerm(raw: string) {
  return raw.trim().replace(/[%*\\",()]/g, ' ').replace(/\s+/g, ' ').trim().replace(/_/g, '\\_')
}

export type BookingPaymentFilter = 'paid' | 'pending' | 'refunded' | 'all'

const byNewest = (a: any, b: any) => {
  // Same order the database gives for created_at DESC: newest first, rows without a date first.
  if (a.created_at !== b.created_at) {
    if (a.created_at == null) return -1
    if (b.created_at == null) return 1
    return a.created_at < b.created_at ? 1 : -1
  }
  return String(a.id).localeCompare(String(b.id))
}

/**
 * One page of the booking list, newest first, with the customers those bookings belong to.
 * `search` matches the booking reference or the guest's name, email or phone (case-insensitive).
 * Asks for one extra row so the page knows whether a "Show more" button is needed.
 */
export async function fetchBookingsPage(
  db: SupabaseClient,
  opts: { paymentFilter: BookingPaymentFilter; search: string; limit: number },
) {
  const term = sanitizeSearchTerm(opts.search)
  const want = opts.limit + 1
  const base = () => {
    let q: any = db.from('bookings').select('*')
    if (opts.paymentFilter !== 'all') q = q.eq('payment_status', opts.paymentFilter)
    return q
  }

  let rows: any[] = []
  if (!term) {
    const { data, error } = await base().order('created_at', { ascending: false }).order('id').limit(want)
    if (error) return { error, bookings: null as any[] | null, customers: null as any[] | null, hasMore: false }
    rows = data ?? []
  } else {
    const { data: matched, error: customerError } = await db
      .from('customers')
      .select('id')
      .or(`name.ilike."%${term}%",email.ilike."%${term}%",phone.ilike."%${term}%"`)
      .limit(1000)
    if (customerError) return { error: customerError, bookings: null as any[] | null, customers: null as any[] | null, hasMore: false }

    const ids = (matched ?? []).map((c: any) => String(c.id))
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
    const referenceFilter = `reference.ilike."%${term}%"`
    const filters = chunks.length
      ? chunks.map(chunk => `${referenceFilter},customer_id.in.(${chunk.map(id => `"${id}"`).join(',')})`)
      : [referenceFilter]

    const results = await Promise.all(filters.map(f => base().or(f).order('created_at', { ascending: false }).order('id').limit(want)))
    const failed = results.find(r => r.error)
    if (failed) return { error: failed.error, bookings: null as any[] | null, customers: null as any[] | null, hasMore: false }
    const seen = new Set<string>()
    for (const r of results) for (const row of r.data ?? []) if (!seen.has(row.id)) { seen.add(row.id); rows.push(row) }
    rows.sort(byNewest)
    rows = rows.slice(0, want)
  }

  const hasMore = rows.length > opts.limit
  const bookings = rows.slice(0, opts.limit)

  const customerIds = Array.from(new Set(bookings.map(b => b.customer_id).filter(Boolean).map(String)))
  let customers: any[] = []
  for (let i = 0; i < customerIds.length; i += 100) {
    const { data } = await db.from('customers').select('*').in('id', customerIds.slice(i, i + 100))
    customers = customers.concat(data ?? [])
  }
  return { error: null, bookings, customers, hasMore }
}

/**
 * Payment totals for the whole history without downloading whole payment rows:
 * only the amount of successful/refunded payments is read (in chunks of 1000), and pending ones are counted.
 */
export async function fetchPaymentTotals(db: SupabaseClient) {
  const [sums, pending] = await Promise.all([
    fetchAllPages(() => db.from('payments').select('status,amount').in('status', ['success', 'refunded']).order('id')),
    db.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  if (sums.error) return null
  let total = 0
  let refunded = 0
  for (const row of sums.data ?? []) {
    if (row.status === 'success') total += Number(row.amount || 0)
    else if (row.status === 'refunded') refunded += Number(row.amount || 0)
  }
  return { total, refunded, pending: pending.count ?? 0 }
}
