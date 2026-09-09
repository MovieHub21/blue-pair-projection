'use client'
import { useStore } from '../../../store/useStore'
import EditablePrice from '../../../components/admin/EditablePrice'
import { Info } from 'lucide-react'

export default function MenuManagement() {
  const { menuItems, updateMenuItemPrice, toggleMenuItemAvailable } = useStore()
  const outlets = Array.from(new Set(menuItems.map(m => m.outlet)))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Menu Management</h1>
      <div className="flex items-center gap-2 text-sm text-navy-500 bg-cream-100 rounded-xl px-4 py-3 mb-6"><Info size={15} className="text-gold-600 shrink-0" />Price and availability changes here update the public menu instantly across all outlets.</div>
      {outlets.map(o => (
        <div key={o} className="mb-8">
          <h4 className="font-semibold mb-3">{o}</h4>
          <div className="card divide-y divide-black/5">
            {menuItems.filter(m => m.outlet === o).map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                <div><b className="text-sm block">{m.name}</b><span className="text-xs text-navy-400">{m.category}</span></div>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>{m.available ? 'Available' : 'Sold out'}</button>
                  <EditablePrice value={m.price} onSave={v => updateMenuItemPrice(m.id, v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
