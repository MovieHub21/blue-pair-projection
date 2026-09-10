import { getMyPayments } from '../../../../lib/account'
import { naira, formatDate } from '../../../../lib/format'

export default async function InvoicesPage() {
  const payments = await getMyPayments()
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Invoices</h1>
      {payments.length === 0 ? (
        <div className="card p-8 text-center text-sm text-navy-500">No invoices yet — these appear once a booking payment is recorded.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Reference</th><th className="p-4">Booking</th><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-black/5 last:border-none">
                  <td className="p-4 font-medium">{p.reference}</td>
                  <td className="p-4 text-navy-500">{p.bookingRef}</td>
                  <td className="p-4 text-navy-500">{formatDate(p.date)}</td>
                  <td className="p-4 font-display">{naira(p.amount)}</td>
                  <td className="p-4"><span className={p.status === 'success' ? 'pill-green' : p.status === 'refunded' ? 'pill-red' : 'pill-amber'}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
