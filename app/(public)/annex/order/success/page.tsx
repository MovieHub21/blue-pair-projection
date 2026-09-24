import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function AnnexOrderSuccess({ searchParams }: { searchParams: { reference?: string } }) {
  return <main className="min-h-[70vh] bg-cream-50 px-5 py-16"><div className="mx-auto max-w-lg rounded-3xl border border-gold-500/20 bg-white p-8 text-center shadow-sm"><CheckCircle2 size={42} className="mx-auto text-emerald-600" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-gold-600">Order placed</p><h1 className="mt-2 text-3xl font-semibold text-navy-950">We have your order</h1><p className="mt-3 text-sm leading-6 text-navy-500">Your order is now pending. The Annex team has been notified and you can track it from your guest dashboard.</p>{searchParams.reference && <p className="mt-4 font-mono text-sm font-bold text-navy-900">{searchParams.reference}</p>}<Link href="/account/orders" className="btn-primary mt-7 inline-flex">View my order</Link></div></main>
}
