'use client'

import { useCallback, useEffect, useState } from 'react'
import EditablePrice from '../../../components/admin/EditablePrice'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapDrink, mapMenuItem } from '../../../lib/mappers'
import type { Drink, MenuItem } from '../../../data/mock'

const TABS = ['Outdoor Eatery', 'Grilling', 'Bar', 'VIP Lounge', 'Restaurant'] as const

export default function AnnexManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [tab, setTab] = useState<typeof TABS[number]>('Grilling')

  const loadData = useCallback(async () => {
    const [miRes, drRes] = await Promise.all([
      supabase.from('menu_items').select('*').in('outlet', ['Annex Grilling', 'Annex Restaurant']).order('name'),
      supabase.from('drinks').select('*').eq('bar', 'Annex Bar').order('name'),
    ])
    if (miRes.data) setMenuItems(miRes.data.map(mapMenuItem))
    if (drRes.data) setDrinks(drRes.data.map(mapDrink))
  }, [])

  useEffect(() => {
    void loadData()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'menu_items' || detail.table === 'drinks') {
        void loadData()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadData])

  const grillItems = menuItems.filter(m => m.outlet === 'Annex Grilling')
  const restaurantItems = menuItems.filter(m => m.outlet === 'Annex Restaurant')
  const barItems = drinks.filter(d => d.bar === 'Annex Bar')

  async function updateMenuItemPrice(id: string, price: number) {
    const { error } = await supabase.from('menu_items').update({ price }).eq('id', id)
    if (error) {
      pushToast('Failed to update price', 'error')
      return
    }
    setMenuItems(prev => prev.map(m => (m.id === id ? { ...m, price } : m)))
    pushToast('Price updated', 'success')
  }

  async function toggleMenuItemAvailable(id: string) {
    const current = menuItems.find(m => m.id === id)
    if (!current) return
    const next = !current.available
    const { error } = await supabase.from('menu_items').update({ available: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update availability', 'error')
      return
    }
    setMenuItems(prev => prev.map(m => (m.id === id ? { ...m, available: next } : m)))
    pushToast(`Item marked as ${next ? 'available' : 'sold out'}`, 'info')
  }

  async function updateDrinkPrice(id: string, price: number) {
    const { error } = await supabase.from('drinks').update({ price }).eq('id', id)
    if (error) {
      pushToast('Failed to update price', 'error')
      return
    }
    setDrinks(prev => prev.map(d => (d.id === id ? { ...d, price } : d)))
    pushToast('Price updated', 'success')
  }

  async function toggleDrinkAvailable(id: string) {
    const current = drinks.find(d => d.id === id)
    if (!current) return
    const next = !current.available
    const { error } = await supabase.from('drinks').update({ available: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update availability', 'error')
      return
    }
    setDrinks(prev => prev.map(d => (d.id === id ? { ...d, available: next } : d)))
    pushToast(`Drink marked as ${next ? 'available' : 'sold out'}`, 'info')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Annex Management</h1>
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={'px-4 py-2.5 rounded-full text-sm font-semibold border ' + (tab === t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Outdoor Eatery' && (
        <div className="card p-6 max-w-2xl text-sm text-navy-500">
          Outdoor Eatery menu items are managed in the Grilling and Restaurant tabs above (outlet: Annex Grilling / Annex Restaurant). A dedicated page for its hours and description isn&apos;t wired up yet.
        </div>
      )}
      {tab === 'Grilling' && (
        <div className="card divide-y divide-black/5">
          {grillItems.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <b className="text-sm">{m.name}</b>
              <div className="flex items-center gap-4">
                <button onClick={() => void toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>
                  {m.available ? 'Available' : 'Sold out'}
                </button>
                <EditablePrice value={m.price} onSave={v => void updateMenuItemPrice(m.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'Bar' && (
        <div className="card divide-y divide-black/5">
          {barItems.map(d => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <b className="text-sm block">{d.name}</b>
                <span className="text-xs text-navy-400">{d.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => void toggleDrinkAvailable(d.id)} className={d.available ? 'pill-green' : 'pill-red'}>
                  {d.available ? 'Available' : 'Sold out'}
                </button>
                <EditablePrice value={d.price} onSave={v => void updateDrinkPrice(d.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'VIP Lounge' && (
        <div className="card p-6 max-w-2xl text-sm text-navy-500">
          VIP Lounge content (description, hours, photos) is managed under <b>Outlets → VIP Lounge</b> in the sidebar — that page is fully live on the public site.
        </div>
      )}
      {tab === 'Restaurant' && (
        <div className="card divide-y divide-black/5">
          {restaurantItems.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <b className="text-sm">{m.name}</b>
              <div className="flex items-center gap-4">
                <button onClick={() => void toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>
                  {m.available ? 'Available' : 'Sold out'}
                </button>
                <EditablePrice value={m.price} onSave={v => void updateMenuItemPrice(m.id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
