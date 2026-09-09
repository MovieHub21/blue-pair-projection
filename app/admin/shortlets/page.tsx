'use client'
import { useStore } from '../../../store/useStore'
import { naira } from '../../../lib/format'
import EditablePrice from '../../../components/admin/EditablePrice'
import { Plus } from 'lucide-react'

export default function ShortLetManagement() {
  const { shortLets, pushToast } = useStore()

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Short-let Management</h1>
        <button onClick={() => pushToast('Property added', 'success')} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add property</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {shortLets.map(sl => (
          <div key={sl.id} className="card overflow-hidden flex">
            <img src={sl.image} className="w-32 h-full object-cover shrink-0" />
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start gap-2">
                <div><b className="block">{sl.name}</b><span className="text-xs text-navy-400">{sl.type} · {sl.bedrooms} bedrooms</span></div>
                <button onClick={() => pushToast(`${sl.name} availability toggled`, 'info')} className={sl.available ? 'pill-green' : 'pill-red'}>{sl.available ? 'Available' : 'Booked'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{sl.amenities.slice(0,3).map(a => <span key={a} className="tag">{a}</span>)}</div>
              <div className="flex items-center justify-between mt-4">
                <EditablePrice value={sl.price} onSave={() => pushToast('Short-let price updated', 'success')} />
                <div className="flex gap-2"><button className="text-xs font-semibold text-navy-900">Edit</button><button className="text-xs font-semibold text-navy-400">Photos</button></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
