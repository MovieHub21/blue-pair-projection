'use client'
import { useStore } from '../../../store/useStore'
import { formatDate, initials } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function CustomerManagement() {
  const { customers, bookings } = useStore()
  const bookingCount = (id: string) => bookings.filter(b => b.customerId === id).length

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Customer Management</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Bookings</th><th className="p-4">Last stay</th><th className="p-4">Status</th>
          </tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gold-50 text-gold-600 text-[11px] font-bold flex items-center justify-center">{initials(c.name)}</div><b>{c.name}</b></div></td>
                <td className="p-4 text-navy-500">{c.email}</td>
                <td className="p-4 text-navy-500">{c.phone}</td>
                <td className="p-4 text-navy-500">{bookingCount(c.id)}</td>
                <td className="p-4 text-navy-500">{c.lastStay ? formatDate(c.lastStay) : '—'}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
