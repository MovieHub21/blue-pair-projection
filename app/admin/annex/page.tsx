'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import EditablePrice from '../../../components/admin/EditablePrice'

const TABS = ['Outdoor Eatery', 'Grilling', 'Bar', 'VIP Lounge', 'Restaurant'] as const

export default function AnnexManagement() {
  const { menuItems, drinks, updateMenuItemPrice, toggleMenuItemAvailable, updateDrinkPrice, toggleDrinkAvailable } = useStore()
  const [tab, setTab] = useState<typeof TABS[number]>('Grilling')

  const grillItems = menuItems.filter(m => m.outlet === 'Annex Grilling')
  const restaurantItems = menuItems.filter(m => m.outlet === 'Annex Restaurant')
  const barItems = drinks.filter(d => d.bar === 'Annex Bar')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Annex Management</h1>
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={'px-4 py-2.5 rounded-full text-sm font-semibold border ' + (tab===t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{t}</button>)}
      </div>

      {tab === 'Outdoor Eatery' && (
        <div className="card p-6 max-w-2xl flex flex-col gap-4">
          <div><label className="field-label">Hours</label><input className="field-input" defaultValue="Daily, 12:00 PM – 1:00 AM" /></div>
          <div><label className="field-label">Description</label><textarea className="field-input !h-auto py-2.5" rows={3} defaultValue="Open-air seating scattered across the Annex courtyard, lit by string lights." /></div>
          <button className="btn-primary w-fit">Save changes</button>
        </div>
      )}
      {tab === 'Grilling' && (
        <div className="card divide-y divide-black/5">
          {grillItems.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <b className="text-sm">{m.name}</b>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>{m.available ? 'Available' : 'Sold out'}</button>
                <EditablePrice value={m.price} onSave={v => updateMenuItemPrice(m.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'Bar' && (
        <div className="card divide-y divide-black/5">
          {barItems.map(d => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
              <div><b className="text-sm block">{d.name}</b><span className="text-xs text-navy-400">{d.category}</span></div>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleDrinkAvailable(d.id)} className={d.available ? 'pill-green' : 'pill-red'}>{d.available ? 'Available' : 'Sold out'}</button>
                <EditablePrice value={d.price} onSave={v => updateDrinkPrice(d.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'VIP Lounge' && (
        <div className="card p-6 max-w-2xl flex flex-col gap-4">
          <div><label className="field-label">Minimum spend</label><input className="field-input" defaultValue="₦100,000" /></div>
          <div><label className="field-label">Hours</label><input className="field-input" defaultValue="Daily, 5:00 PM – 2:00 AM" /></div>
          <button className="btn-primary w-fit">Save changes</button>
        </div>
      )}
      {tab === 'Restaurant' && (
        <div className="card divide-y divide-black/5">
          {restaurantItems.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <b className="text-sm">{m.name}</b>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>{m.available ? 'Available' : 'Sold out'}</button>
                <EditablePrice value={m.price} onSave={v => updateMenuItemPrice(m.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
