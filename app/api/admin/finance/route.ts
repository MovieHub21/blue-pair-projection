import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../lib/account'
import { getMyPermissions } from '../../../../lib/permissions'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

const METHODS = new Set(['Cash', 'POS', 'Bank Transfer', 'Card'])

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET() {
  const permissions = await getMyPermissions()
  if (!permissions.allowed('finance')) return NextResponse.json({ error: 'Finance access is not permitted.' }, { status: 403 })

  const db = createSupabaseServerClient()
  const [{ data: transactions, error }, { data: expenses, error: expenseError }] = await Promise.all([
    db.from('financial_transactions').select('*').order('occurred_at', { ascending: false }).limit(300),
    db.from('financial_expenses').select('*').order('incurred_at', { ascending: false }).limit(100),
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

  return NextResponse.json({
    summary: { grossSales, refunds, expenses: expensesTotal, net },
    byMethod,
    transactions: posted.slice(0, 120),
    expenses: expenses ?? [],
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
