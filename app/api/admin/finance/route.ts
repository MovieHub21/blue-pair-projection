import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/account'
import { getMyPermissions } from '../../../../lib/permissions'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

const METHODS = new Set(['POS', 'Bank Transfer', 'Card'])

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(request: Request) {
  const permissions = await getMyPermissions()
  if (!permissions.allowed('finance')) return NextResponse.json({ error: 'Finance access is not permitted.' }, { status: 403 })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
  const params = new URL(request.url).searchParams
  const from = params.get('from') || today
  const to = params.get('to') || today
  if (!validDate(from) || !validDate(to) || from > to) return NextResponse.json({ error: 'Choose a valid date range.' }, { status: 400 })
  const startAt = `${from}T00:00:00+01:00`
  const endAt = `${to}T23:59:59.999+01:00`
  const db = createSupabaseServerClient()
  const [{ data: transactions, error }, { data: expenses, error: expenseError }] = await Promise.all([
    db.from('financial_transactions').select('*').gte('occurred_at', startAt).lte('occurred_at', endAt).order('occurred_at', { ascending: false }).limit(1000),
    db.from('financial_expenses').select('*').gte('incurred_at', startAt).lte('incurred_at', endAt).order('incurred_at', { ascending: false }).limit(1000),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 500 })

  const posted = (transactions ?? []).filter((t: any) => t.status === 'posted')
  const grossSales = posted.filter((t: any) => t.direction === 'credit' && t.transaction_type === 'sale').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const refunds = posted.filter((t: any) => t.transaction_type === 'refund').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const expensesTotal = posted.filter((t: any) => t.transaction_type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const net = grossSales - refunds - expensesTotal

  const byMethod: Record<string, number> = {}
  for (const t of posted.filter((row: any) => row.transaction_type === 'sale')) {
    const method = t.method || 'Other'
    byMethod[method] = (byMethod[method] || 0) + Number(t.amount)
  }

  const userIds = Array.from(new Set([...posted.map((row: any) => row.created_by), ...(expenses ?? []).map((row: any) => row.created_by)].filter(Boolean))) as string[]
  const customerIds = Array.from(new Set(posted.map((row: any) => row.customer_id).filter(Boolean))) as string[]
  const [profilesResult, customersResult] = await Promise.all([
    userIds.length ? db.from('profiles').select('id,name,email').in('id', userIds) : Promise.resolve({ data: [] as any[] }),
    customerIds.length ? db.from('customers').select('id,email').in('id', customerIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const profiles = new Map((profilesResult.data ?? []).map((profile: any) => [profile.id, profile]))
  const customers = new Map((customersResult.data ?? []).map((customer: any) => [customer.id, customer]))
  const transactionsWithContext = posted.map((row: any) => ({
    ...row,
    created_by_name: (profiles.get(row.created_by) as any)?.name ?? null,
    created_by_email: (profiles.get(row.created_by) as any)?.email ?? null,
    customer_email: (customers.get(row.customer_id) as any)?.email ?? null,
  }))
  const expensesWithContext = (expenses ?? []).map((row: any) => ({
    ...row,
    created_by_name: (profiles.get(row.created_by) as any)?.name ?? null,
    created_by_email: (profiles.get(row.created_by) as any)?.email ?? null,
  }))

  return NextResponse.json({
    summary: { grossSales, refunds, expenses: expensesTotal, net },
    byMethod,
    transactions: transactionsWithContext,
    expenses: expensesWithContext,
  })
}

export async function POST(request: Request) {
  const permissions = await getMyPermissions()
  if (!permissions.allowed('finance')) return NextResponse.json({ error: 'Finance access is not permitted.' }, { status: 403 })

  const { user } = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const body = await request.json()
    const category = String(body.category ?? '').trim()
    const vendor = String(body.vendor ?? '').trim()
    const description = String(body.description ?? '').trim()
    const amount = Number(body.amount)
    const method = String(body.method ?? '').trim()
    const incurredAt = String(body.incurredAt ?? '').trim()

    if (!category || !description || !Number.isFinite(amount) || amount <= 0 || !METHODS.has(method)) {
      return NextResponse.json({ error: 'Category, description, amount and a valid payment method are required.' }, { status: 400 })
    }
    if (incurredAt && !validDate(incurredAt)) return NextResponse.json({ error: 'Expense date is invalid.' }, { status: 400 })

    const db = createSupabaseServerClient()
    const reference = `EXP-${Date.now()}`
    const { data, error } = await db.from('financial_expenses').insert({
      reference,
      category,
      vendor: vendor || null,
      description,
      amount: Math.round(amount * 100) / 100,
      method,
      incurred_at: incurredAt ? `${incurredAt}T12:00:00+01:00` : new Date().toISOString(),
      created_by: user.id,
    }).select('*').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ expense: data }, { status: 201 })
  } catch (error: any) {
    console.error('[admin/finance]', error)
    return NextResponse.json({ error: error?.message || 'Unable to save finance entry.' }, { status: 500 })
  }
}
