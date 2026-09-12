'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Loader2, Plus, ReceiptText, WalletCards } from 'lucide-react'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

interface Transaction {
  id: string
  transaction_type: string
  direction: 'credit' | 'debit'
  amount: number | string
  method?: string | null
  reference?: string | null
  description: string
  occurred_at: string
}

interface Expense {
  id: string
  reference: string
  category: string
  vendor?: string | null
  description: string
  amount: number | string
  method: string
  incurred_at: string
}

interface FinanceData {
  summary: { grossSales: number; refunds: number; expenses: number; net: number }
  byMethod: Record<string, number>
  transactions: Transaction[]
  expenses: Expense[]
}

const emptyForm = { category: '', vendor: '', description: '', amount: '', method: 'Bank Transfer', incurredAt: new Date().toISOString().slice(0, 10) }

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/finance', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load finance data.')
      setData(payload)
    } catch (err: any) {
      setError(err.message || 'Unable to load finance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const netTone = useMemo(() => (data?.summary.net ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700', [data])

  async function submitExpense(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to save expense.')
      setForm(emptyForm)
      setShowExpense(false)
      await load()
    } catch (err: any) {
      setError(err.message || 'Unable to save expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-900">Financial control</h1>
          <p className="mt-1 max-w-2xl text-sm text-navy-500">A single view of posted income, refunds, expenses and the resulting operating position.</p>
        </div>
        <button onClick={() => setShowExpense(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-800">
          <Plus size={16} /> Record expense
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading && !data ? (
        <div className="card flex min-h-48 items-center justify-center"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Gross sales" value={naira(data.summary.grossSales)} icon={<ArrowDownLeft size={17} />} />
            <Metric label="Refunds" value={naira(data.summary.refunds)} icon={<ArrowUpRight size={17} />} />
            <Metric label="Expenses" value={naira(data.summary.expenses)} icon={<ReceiptText size={17} />} />
            <Metric label="Net position" value={naira(data.summary.net)} icon={<CircleDollarSign size={17} />} valueClass={netTone} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                <div><h2 className="font-semibold text-navy-900">Recent ledger</h2><p className="text-xs text-navy-400">Posted transactions only</p></div>
                <WalletCards size={18} className="text-gold-700" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead><tr className="border-b border-black/5 text-left text-xs text-navy-400"><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Amount</th></tr></thead>
                  <tbody>
                    {data.transactions.map((t) => {
                      const debit = t.direction === 'debit'
                      return <tr key={t.id} className="border-b border-black/5 last:border-0">
                        <td className="px-5 py-3 font-medium">{t.reference || '—'}</td>
                        <td className="max-w-[280px] px-5 py-3 text-navy-500">{t.description}</td>
                        <td className="px-5 py-3 text-navy-500">{t.method || '—'}</td>
                        <td className="px-5 py-3 text-navy-500">{formatDate(t.occurred_at)}</td>
                        <td className={`px-5 py-3 text-right font-semibold ${debit ? 'text-red-700' : 'text-emerald-700'}`}>{debit ? '−' : '+'}{naira(Number(t.amount))}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4"><h2 className="font-semibold text-navy-900">Income by method</h2><p className="text-xs text-navy-400">Posted room/payment revenue</p></div>
              <div className="space-y-3 p-5">
                {Object.entries(data.byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3"><span className="text-sm text-navy-600">{method}</span><span className="font-semibold text-navy-900">{naira(amount)}</span></div>
                ))}
                {!Object.keys(data.byMethod).length && <p className="text-sm text-navy-400">No posted income yet.</p>}
              </div>
            </section>
          </div>

          <section className="card overflow-hidden">
            <div className="border-b border-black/5 px-5 py-4"><h2 className="font-semibold text-navy-900">Recorded expenses</h2><p className="text-xs text-navy-400">Operational costs are posted into the ledger automatically.</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-black/5 text-left text-xs text-navy-400"><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Amount</th></tr></thead>
                <tbody>{data.expenses.map((expense) => <tr key={expense.id} className="border-b border-black/5 last:border-0"><td className="px-5 py-3 font-medium">{expense.reference}</td><td className="px-5 py-3">{expense.category}</td><td className="px-5 py-3 text-navy-500">{expense.vendor || '—'}</td><td className="px-5 py-3 text-navy-500">{expense.method}</td><td className="px-5 py-3 text-navy-500">{formatDate(expense.incurred_at)}</td><td className="px-5 py-3 text-right font-semibold text-red-700">−{naira(Number(expense.amount))}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {showExpense && <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-semibold text-navy-900">Record an expense</h2><p className="text-sm text-navy-500">This creates the expense and its ledger entry together.</p></div><button onClick={() => setShowExpense(false)} className="rounded-lg px-2 py-1 text-navy-400 hover:bg-navy-50">✕</button></div>
          <form onSubmit={submitExpense} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category"><input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Utilities" /></Field>
              <Field label="Vendor"><input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Supplier or company" /></Field>
            </div>
            <Field label="Description"><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What was paid for?" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Amount"><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Method"><select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}><option>Bank Transfer</option><option>Cash</option><option>POS</option><option>Card</option></select></Field>
              <Field label="Date"><input required type="date" value={form.incurredAt} onChange={e => setForm({ ...form, incurredAt: e.target.value })} /></Field>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowExpense(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-navy-600">Cancel</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin" />} Save expense</button></div>
          </form>
        </div>
      </div>}
    </div>
  )
}

function Metric({ label, value, icon, valueClass = 'text-navy-900' }: { label: string; value: string; icon: React.ReactNode; valueClass?: string }) {
  return <div className="card p-5"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-400">{label}</span><span className="rounded-xl bg-gold-50 p-2 text-gold-700">{icon}</span></div><div className={`text-xl font-bold ${valueClass}`}>{value}</div></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-navy-700"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</span>{children}</label>
}
