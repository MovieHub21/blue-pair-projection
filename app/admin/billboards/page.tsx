'use client'
import { useStore } from '../../../store/useStore'
import { naira } from '../../../lib/format'
import EditablePrice from '../../../components/admin/EditablePrice'

export default function BillboardManagement() {
  const { billboards, pushToast } = useStore()
  const reservations = [
    { company: 'MTN Nigeria', location: 'Main Entrance Gate', duration: '3 months', status: 'active' },
    { company: 'Chivita Foods', location: 'Poolside Wall', duration: '1 month', status: 'pending' },
  ]
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Billboard Management</h1>
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {billboards.map(b => (
          <div key={b.id} className="card overflow-hidden">
            <div className="h-32"><img src={b.image} className="w-full h-full object-cover" /></div>
            <div className="p-5">
              <b className="block">{b.location}</b>
              <span className="text-xs text-navy-400">{b.dimensions}</span>
              <div className="flex justify-between items-center mt-3">
                <EditablePrice value={b.price} onSave={() => pushToast('Billboard price updated', 'success')} />
                <button onClick={() => pushToast('Availability toggled', 'info')} className={b.available ? 'pill-green' : 'pill-red'}>{b.available ? 'Available' : 'Reserved'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <h4 className="font-semibold mb-3">Reservation requests</h4>
      <div className="card divide-y divide-black/5">
        {reservations.map((r,i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 text-sm">
            <div><b className="block">{r.company}</b><span className="text-xs text-navy-400">{r.location} · {r.duration}</span></div>
            <span className={r.status === 'active' ? 'pill-green' : 'pill-amber'}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
