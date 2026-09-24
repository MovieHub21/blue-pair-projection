import Link from 'next/link'

export default function AnnexOrderError({ searchParams }: { searchParams: { reason?: string } }) {
  return <main className="min-h-[70vh] bg-cream-50 px-5 py-16"><div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-600">Order payment</p><h1 className="mt-2 text-3xl font-semibold text-navy-950">We could not complete the order</h1><p className="mt-3 text-sm leading-6 text-navy-500">Your payment could not be confirmed for this order. If your bank was charged, please contact the hotel before trying again.</p>{searchParams.reason && <p className="mt-4 text-xs text-navy-400">Reference: {searchParams.reason}</p>}<div className="mt-7 flex justify-center gap-2"><Link href="/annex" className="btn-outline">Back to Annex</Link><Link href="/account/orders" className="btn-primary">My orders</Link></div></div></main>
}
