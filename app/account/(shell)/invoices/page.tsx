'use client'
import { useStore } from '../../../../store/useStore'
import { naira, formatDate } from '../../../../lib/format'
import { Download } from 'lucide-react'

export default function InvoicesPage() {
  const { payments } = useStore()
  const mine = payments.filter(p => p.customer === 'Adaeze Okonkwo')
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Invoices</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Reference</th><th className="p-4">Booking</th><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {mine.map(p => (
              <tr key={p.id} className="border-b border-black/5 last:border-none">
                <td className="p-4 font-medium">{p.reference}</td>
                <td className="p-4 text-navy-500">{p.bookingRef}</td>
                <td className="p-4 text-navy-500">{formatDate(p.date)}</td>
                <td className="p-4 font-display">{naira(p.amount)}</td>
                <td className="p-4"><span className={p.status === 'success' ? 'pill-green' : p.status === 'refunded' ? 'pill-red' : 'pill-amber'}>{p.status}</span></td>
                <td className="p-4"><button className="text-navy-900 font-semibold flex items-center gap-1.5"><Download size={13} />PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
