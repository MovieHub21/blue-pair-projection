'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { deleteImage } from '../../../lib/upload'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapAmenity, mapDrink, mapMenuItem, mapShortLet } from '../../../lib/mappers'
import AnnexOrdersPanel from '../../../components/admin/AnnexOrdersPanel'
import type { Drink, MenuItem, ShortLet } from '../../../data/mock'

type Amenity = {
  key: string
  name: string
  eyebrow: string
  description: string
  heroImage: string
  gallery: string[]
  hours: string
  facilities: string[]
  pricingNote: string
  ctaLabel: string
  published: boolean
}

type BookingRow = {
  id: string
  reference: string
  customer_id: string
  short_let_id: string
  check_in: string
  check_out: string
  amount: number
  payment_status: string
  status: string
  customers?: { name?: string; email?: string } | null
}

const OUTLETS = [
  { key: 'annex-home', label: 'Annex Home' },
  { key: 'annex-outdoor-eatery', label: 'Outdoor Eatery' },
  { key: 'annex-grilling', label: 'Grilling' },
  { key: 'annex-bar', label: 'Bar' },
  { key: 'annex-vip-lounge', label: 'VIP Lounge' },
  { key: 'annex-restaurant', label: 'Restaurant' },
] as const

type Tab = 'Content' | 'Menu' | 'Drinks' | 'Orders' | 'Short-lets' | 'Bookings'

function blankAmenity(key: string, name: string): Amenity {
  return { key, name, eyebrow: '', description: '', heroImage: '', gallery: [], hours: '', facilities: [], pricingNote: '', ctaLabel: 'Reserve now', published: false }
}

type MenuOutlet = 'Annex Grilling' | 'Annex Outdoor Eatery' | 'Annex Restaurant'

type MenuDraft = {
  id?: string
  outlet: MenuOutlet
  category: string
  name: string
  price: string
  image: string
  available: boolean
}

type DrinkDraft = {
  id?: string
  bar: 'Annex Bar'
  category: string
  name: string
  price: string
  image: string
  available: boolean
}

const MENU_OUTLETS: { outlet: MenuOutlet; label: string }[] = [
  { outlet: 'Annex Grilling', label: 'Grilling' },
  { outlet: 'Annex Outdoor Eatery', label: 'Outdoor Eatery' },
  { outlet: 'Annex Restaurant', label: 'Annex Restaurant' },
]

const TABS: Tab[] = ['Menu', 'Drinks', 'Orders', 'Short-lets', 'Bookings']

const emptyMenu = (outlet: MenuOutlet): MenuDraft => ({
  outlet, category: '', name: '', price: '', image: '', available: true,
})

const MENU_CATEGORIES = ['Starters', 'Main Course', 'Grills', 'Sides', 'Salads', 'Desserts', 'Breakfast', 'Snacks']
const DRINK_CATEGORIES = ['Cocktails', 'Mocktails', 'Wine', 'Beer', 'Spirits', 'Whiskey', 'Champagne', 'Soft Drinks', 'Juices', 'Water']

const emptyDrink: DrinkDraft = {
  bar: 'Annex Bar', category: '', name: '', price: '', image: '', available: true,
}

export default function AnnexManagement() {
  const [tab, setTab] = useState<Tab>('Menu')
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('annex-home')
  const [amenityDraft, setAmenityDraft] = useState<Amenity>(blankAmenity('annex-home', 'Annex Home'))
  const [savingContent, setSavingContent] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [shortLets, setShortLets] = useState<ShortLet[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [barOrders, setBarOrders] = useState<any[]>([])
  const [editingMenu, setEditingMenu] = useState<MenuDraft | null>(null)
  const [editingDrink, setEditingDrink] = useState<DrinkDraft | null>(null)
  const [deleteMenu, setDeleteMenu] = useState<MenuItem | null>(null)
  const [deleteDrink, setDeleteDrink] = useState<Drink | null>(null)
  const [editingShortLet, setEditingShortLet] = useState<ShortLet | null>(null)
  const [showAddShortLet, setShowAddShortLet] = useState(false)
  const [deleteShortLet, setDeleteShortLet] = useState<ShortLet | null>(null)
  const [shortLetDraft, setShortLetDraft] = useState({
    name: '', type: 'Apartment', price: '', bedrooms: '1', amenities: '', image: '', description: '',
  })

  const load = useCallback(async () => {
    const [a, m, d, s, b, o] = await Promise.all([
      supabase.from('amenities').select('*').like('key', 'annex-%').order('name'),
      supabase.from('menu_items').select('*').in('outlet', MENU_OUTLETS.map(x => x.outlet)).order('name'),
      supabase.from('drinks').select('*').eq('bar', 'Annex Bar').order('name'),
      supabase.from('short_lets').select('*').order('price'),
      supabase.from('bookings').select('id,reference,customer_id,short_let_id,check_in,check_out,amount,payment_status,status,customers(name,email)').not('short_let_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('bar_orders').select('*, bar_order_items(*), customers(name,email)').order('created_at', { ascending: false }),
    ])
    if (a.data) setAmenities(a.data.map(mapAmenity))
    if (m.data) setMenuItems(m.data.map(mapMenuItem))
    if (d.data) setDrinks(d.data.map(mapDrink))
    if (s.data) setShortLets(s.data.map(mapShortLet))
    if (b.data) setBookings(b.data as BookingRow[])
    if (o.data) setBarOrders(o.data as any[])
  }, [])

  useEffect(() => {
    const found = amenities.find(item => item.key === selectedKey)
    const label = OUTLETS.find(item => item.key === selectedKey)?.label || selectedKey
    setAmenityDraft(found ? { ...found } : blankAmenity(selectedKey, label))
  }, [amenities, selectedKey])

  async function saveAmenity() {
    setSavingContent(true)
    const { error } = await supabase.from('amenities').upsert({
      key: amenityDraft.key,
      name: amenityDraft.name,
      eyebrow: amenityDraft.eyebrow,
      description: amenityDraft.description,
      hero_image: amenityDraft.heroImage,
      gallery: amenityDraft.gallery,
      hours: amenityDraft.hours,
      facilities: amenityDraft.facilities,
      pricing_note: amenityDraft.pricingNote,
      cta_label: amenityDraft.ctaLabel,
      published: amenityDraft.published,
    }, { onConflict: 'key' })
    setSavingContent(false)
    if (error) return pushToast('Failed to save Annex content: ' + error.message, 'error')
    const oldAmenity = amenities.find(item => item.key === amenityDraft.key)
    if (oldAmenity?.heroImage && oldAmenity.heroImage !== amenityDraft.heroImage) { try { await deleteImage(oldAmenity.heroImage) } catch { pushToast('Content saved, but the old hero image could not be deleted from Storage.', 'error') } }
    const oldGallery = oldAmenity?.gallery ?? []
    const removedGallery = oldGallery.filter(url => !amenityDraft.gallery.includes(url))
    for (const url of removedGallery) { try { await deleteImage(url) } catch { pushToast('Content saved, but one old gallery image could not be deleted from Storage.', 'error'); break } }
    await load()
    pushToast('Annex content saved', 'success')
  }

  useEffect(() => {
    void load()
    const refresh = (event: Event) => {
      const table = (event as CustomEvent).detail?.table
      if (!table || ['amenities', 'menu_items', 'drinks', 'short_lets', 'bookings', 'bar_orders', 'bar_order_items'].includes(table)) void load()
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [load])

  async function saveMenu(draft: MenuDraft) {
    const patch = {
      outlet: draft.outlet,
      category: draft.category.trim() || 'General',
      name: draft.name.trim(),
      price: Number(draft.price) || 0,
      image: draft.image,
      available: draft.available,
    }
    if (!patch.name) return pushToast('Menu item name is required', 'error')
    const result = draft.id
      ? await supabase.from('menu_items').update(patch).eq('id', draft.id)
      : await supabase.from('menu_items').insert({ id: 'menu_' + Date.now(), ...patch })
    if (result.error) return pushToast('Failed to save menu item: ' + result.error.message, 'error')
    if (draft.id) { const old = menuItems.find(item => item.id === draft.id)?.image; if (old && old !== draft.image) { try { await deleteImage(old) } catch { pushToast('Menu item saved, but the old image could not be deleted from Storage.', 'error') } } }
    setEditingMenu(null); await load(); pushToast('Menu item saved', 'success')
  }

  async function removeMenu() {
    if (!deleteMenu) return
    const { error } = await supabase.from('menu_items').delete().eq('id', deleteMenu.id)
    if (error) return pushToast('Failed to delete menu item: ' + error.message, 'error')
    try { await deleteImage(deleteMenu.image) } catch { pushToast('Menu item deleted, but its image could not be removed from Storage.', 'error') }
    setDeleteMenu(null); await load(); pushToast('Menu item deleted', 'success')
  }

  async function saveDrink(draft: DrinkDraft) {
    const patch = {
      bar: 'Annex Bar',
      category: draft.category.trim() || 'General',
      name: draft.name.trim(),
      price: Number(draft.price) || 0,
      image: draft.image,
      available: draft.available,
    }
    if (!patch.name) return pushToast('Drink name is required', 'error')
    const result = draft.id
      ? await supabase.from('drinks').update(patch).eq('id', draft.id)
      : await supabase.from('drinks').insert({ id: 'drink_' + Date.now(), ...patch })
    if (result.error) return pushToast('Failed to save drink: ' + result.error.message, 'error')
    if (draft.id) { const old = drinks.find(item => item.id === draft.id)?.image; if (old && old !== draft.image) { try { await deleteImage(old) } catch { pushToast('Drink saved, but the old image could not be deleted from Storage.', 'error') } } }
    setEditingDrink(null); await load(); pushToast('Drink saved', 'success')
  }

  async function removeDrink() {
    if (!deleteDrink) return
    const { error } = await supabase.from('drinks').delete().eq('id', deleteDrink.id)
    if (error) return pushToast('Failed to delete drink: ' + error.message, 'error')
    try { await deleteImage(deleteDrink.image) } catch { pushToast('Drink deleted, but its image could not be removed from Storage.', 'error') }
    setDeleteDrink(null); await load(); pushToast('Drink deleted', 'success')
  }

  async function saveShortLet() {
    if (!shortLetDraft.name.trim()) return pushToast('Property name is required', 'error')
    const patch = {
      name: shortLetDraft.name.trim(), type: shortLetDraft.type.trim(), price: Number(shortLetDraft.price) || 0,
      bedrooms: Number(shortLetDraft.bedrooms) || 1,
      amenities: shortLetDraft.amenities.split(',').map(x => x.trim()).filter(Boolean),
      image: shortLetDraft.image, description: shortLetDraft.description,
    }
    const result = editingShortLet
      ? await supabase.from('short_lets').update(patch).eq('id', editingShortLet.id)
      : await supabase.from('short_lets').insert({ id: 'sl_' + Date.now(), ...patch, available: true })
    if (result.error) return pushToast('Failed to save short-let: ' + result.error.message, 'error')
    if (editingShortLet) { const old = shortLets.find(item => item.id === editingShortLet.id)?.image; if (old && old !== patch.image) { try { await deleteImage(old) } catch { pushToast('Short-let saved, but the old image could not be deleted from Storage.', 'error') } } }
    setEditingShortLet(null); setShowAddShortLet(false); await load(); pushToast('Short-let saved', 'success')
  }

  function editShortLet(item: ShortLet) {
    setEditingShortLet(item)
    setShortLetDraft({ name:item.name, type:item.type, price:String(item.price), bedrooms:String(item.bedrooms), amenities:item.amenities.join(', '), image:item.image, description:item.description })
  }

  function newShortLet() {
    setEditingShortLet(null)
    setShortLetDraft({ name:'', type:'Apartment', price:'', bedrooms:'1', amenities:'', image:'', description:'' })
    setShowAddShortLet(true)
  }

  async function removeShortLet() {
    if (!deleteShortLet) return
    const { error } = await supabase.from('short_lets').delete().eq('id', deleteShortLet.id)
    if (error) return pushToast('Failed to delete property: ' + error.message, 'error')
    try { await deleteImage(deleteShortLet.image) } catch { pushToast('Short-let deleted, but its image could not be removed from Storage.', 'error') }
    setDeleteShortLet(null); await load(); pushToast('Short-let deleted', 'success')
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Annex Management</h1>
        <p className="mt-1 text-sm text-navy-400">Manage every Annex outlet, menu, drinks, short-let and booking from one place.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(item => (
          <button key={item} type="button" onClick={() => setTab(item)}
            className={'rounded-full border px-4 py-2.5 text-sm font-semibold ' + (tab === item ? 'border-navy-950 bg-navy-950 text-white' : 'border-black/15')}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'Menu' && (
        <div className="grid gap-6">
          {MENU_OUTLETS.map(({ outlet, label }) => (
            <OutletMenuTable key={outlet} label={label} outlet={outlet}
              items={menuItems.filter(item => item.outlet === outlet)}
              onAdd={() => setEditingMenu(emptyMenu(outlet))}
              onEdit={item => setEditingMenu({ id:item.id, outlet:item.outlet as MenuOutlet, category:item.category, name:item.name, price:String(item.price), image:item.image, available:item.available })}
              onDelete={setDeleteMenu} />
          ))}
        </div>
      )}

      {tab === 'Drinks' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-black/5 p-5">
            <div><h2 className="font-semibold">Annex Bar Drinks</h2><p className="mt-1 text-xs text-navy-400">Add, edit, enable/disable or delete every Annex Bar drink.</p></div>
            <button type="button" className="btn-primary btn-sm" onClick={() => setEditingDrink({...emptyDrink})}><Plus size={14}/>Add drink</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-black/5 text-left text-xs text-navy-400"><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>
            {drinks.map(item => <tr key={item.id} className="border-b border-black/5"><td className="p-4 font-medium"><div className="flex items-center gap-3">{item.image && <img src={item.image} className="h-10 w-10 rounded object-cover" alt=""/>}<span>{item.name}</span></div></td><td className="p-4">{item.category}</td><td className="p-4">₦{Number(item.price).toLocaleString()}</td><td className="p-4"><span className={item.available ? 'pill-green' : 'pill-red'}>{item.available ? 'Available' : 'Sold out'}</span></td><td className="p-4"><div className="flex justify-end gap-3"><button className="text-xs font-semibold" onClick={() => setEditingDrink({id:item.id,bar:'Annex Bar',category:item.category,name:item.name,price:String(item.price),image:item.image,available:item.available})}><Pencil size={14}/></button><button className="text-red-600" onClick={() => setDeleteDrink(item)}><Trash2 size={14}/></button></div></td></tr>)}
            {drinks.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-navy-400">No Annex Bar drinks yet.</td></tr>}
          </tbody></table></div>
        </div>
      )}

      {tab === 'Orders' && <AnnexOrdersPanel orders={barOrders} onRefresh={load} />}

      {tab === 'Short-lets' && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-semibold">Annex short-let properties</h2><p className="mt-1 text-xs text-navy-400">Properties, pricing, descriptions, images and amenities.</p></div><button type="button" onClick={newShortLet} className="btn-primary btn-sm"><Plus size={14}/>Add property</button></div>
          <div className="grid gap-4 md:grid-cols-2">{shortLets.map(item => {
            const today = new Date().toISOString().slice(0,10)
            const booked = bookings.some(b => b.short_let_id === item.id && ['confirmed','checked_in'].includes(b.status) && b.payment_status === 'paid' && b.check_in <= today && b.check_out > today)
            return <div key={item.id} className="card grid grid-cols-[100px_minmax(0,1fr)] overflow-hidden"><img src={item.image} className="h-full min-h-[170px] w-full object-cover" alt={item.name}/><div className="min-w-0 p-4"><div className="flex justify-between gap-2"><div><b>{item.name}</b><p className="mt-1 text-xs text-navy-400">{item.type} · {item.bedrooms} bedrooms</p></div><span className={booked || !item.available ? 'pill-red' : 'pill-green'}>{booked ? 'Booked' : item.available ? 'Available' : 'Disabled'}</span></div><p className="mt-3 line-clamp-2 text-xs text-navy-500">{item.description}</p><div className="font-display mt-3">₦{item.price.toLocaleString()}<span className="font-body text-xs text-navy-400"> /night</span></div><div className="mt-4 flex gap-3"><button onClick={() => editShortLet(item)} className="flex items-center gap-1 text-xs font-semibold"><Pencil size={12}/>Edit</button><button onClick={() => setDeleteShortLet(item)} className="flex items-center gap-1 text-xs font-semibold text-red-600"><Trash2 size={12}/>Delete</button></div></div></div>
          })}</div>
        </div>
      )}

      {tab === 'Bookings' && <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-black/5 text-left text-xs text-navy-400"><th className="p-4">Property</th><th className="p-4">Guest</th><th className="p-4">Dates</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Status</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id} className="border-b border-black/5"><td className="p-4 font-medium">{shortLets.find(s => s.id === b.short_let_id)?.name || 'Short-let'}</td><td className="p-4">{b.customers?.name || b.customers?.email || 'Guest'}</td><td className="p-4">{b.check_in} → {b.check_out}</td><td className="p-4">₦{Number(b.amount).toLocaleString()}</td><td className="p-4 capitalize">{b.payment_status}</td><td className="p-4 capitalize">{b.status}</td></tr>)}{bookings.length===0 && <tr><td colSpan={6} className="p-8 text-center text-navy-400">No short-let bookings yet.</td></tr>}</tbody></table></div>}

      <MenuModal item={editingMenu} onClose={() => setEditingMenu(null)} onSave={saveMenu} />
      <DrinkModal item={editingDrink} onClose={() => setEditingDrink(null)} onSave={saveDrink} />
      <ShortLetModal open={showAddShortLet || Boolean(editingShortLet)} draft={shortLetDraft} onChange={setShortLetDraft} onClose={() => {setShowAddShortLet(false);setEditingShortLet(null)}} onSave={() => void saveShortLet()} />
      <DeleteConfirmDialog open={Boolean(deleteMenu)} itemName={deleteMenu?.name} description="This menu item will be permanently removed." onCancel={() => setDeleteMenu(null)} onConfirm={() => void removeMenu()} />
      <DeleteConfirmDialog open={Boolean(deleteDrink)} itemName={deleteDrink?.name} description="This drink will be permanently removed." onCancel={() => setDeleteDrink(null)} onConfirm={() => void removeDrink()} />
      <DeleteConfirmDialog open={Boolean(deleteShortLet)} itemName={deleteShortLet?.name} description="This short-let will be permanently removed." onCancel={() => setDeleteShortLet(null)} onConfirm={() => void removeShortLet()} />
    </div>
  )
}

function OutletMenuTable({label,outlet,items,onAdd,onEdit,onDelete}:{label:string;outlet:MenuOutlet;items:MenuItem[];onAdd:()=>void;onEdit:(item:MenuItem)=>void;onDelete:(item:MenuItem)=>void}) {
  return <div className="card overflow-hidden">
    <div className="flex items-center justify-between gap-4 border-b border-black/5 p-5"><div><h2 className="font-semibold">{label}</h2><p className="mt-1 text-xs text-navy-400">Separate menu management for {label}.</p></div><button type="button" className="btn-primary btn-sm" onClick={onAdd}><Plus size={14}/>Add item</button></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-black/5 text-left text-xs text-navy-400"><th className="p-4">Item</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>
      {items.map(item=><tr key={item.id} className="border-b border-black/5"><td className="p-4 font-medium"><div className="flex items-center gap-3">{item.image && <img src={item.image} className="h-10 w-10 rounded object-cover" alt=""/>}<span>{item.name}</span></div></td><td className="p-4">{item.category}</td><td className="p-4">₦{Number(item.price).toLocaleString()}</td><td className="p-4"><span className={item.available?'pill-green':'pill-red'}>{item.available?'Available':'Sold out'}</span></td><td className="p-4"><div className="flex justify-end gap-3"><button className="text-xs font-semibold" onClick={()=>onEdit(item)}><Pencil size={14}/></button><button className="text-red-600" onClick={()=>onDelete(item)}><Trash2 size={14}/></button></div></td></tr>)}
      {items.length===0 && <tr><td colSpan={5} className="p-8 text-center text-navy-400">No menu items yet.</td></tr>}
    </tbody></table></div>
  </div>
}

function MenuModal({item,onClose,onSave}:{item:MenuDraft|null;onClose:()=>void;onSave:(item:MenuDraft)=>void}) {
  if(!item) return null
  return <MenuModalInner key={item.id || 'new-'+item.outlet} item={item} onClose={onClose} onSave={onSave}/>
}
function MenuModalInner({item,onClose,onSave}:{item:MenuDraft;onClose:()=>void;onSave:(item:MenuDraft)=>void}) {
  const [draft,setDraft]=useState(item)
  return <Modal open={true} onClose={onClose} title={draft.id?'Edit menu item':'Add menu item'}><div className="grid gap-4">
    <div className="rounded-lg bg-cream-50 p-3 text-sm font-semibold">{draft.outlet}</div>
    <input className="field-input" placeholder="Item name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
    <select className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="">Select category</option>{MENU_CATEGORIES.map(category=><option key={category} value={category}>{category}</option>)}</select>
    <input type="number" className="field-input" placeholder="Price" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/>
    <div><label className="field-label">Image</label><input className="field-input" placeholder="Image URL" value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})}/><ImageUploader folder={'annex/menu/'+draft.outlet.toLowerCase().replaceAll(' ','-')} label="Upload image" onUploaded={urls=>setDraft({...draft,image:urls[0]||''})}/></div>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.available} onChange={e=>setDraft({...draft,available:e.target.checked})}/>Available</label>
    <button className="btn-primary w-full justify-center" onClick={()=>onSave(draft)}><Save size={14}/>Save item</button>
  </div></Modal>
}

function DrinkModal({item,onClose,onSave}:{item:DrinkDraft|null;onClose:()=>void;onSave:(item:DrinkDraft)=>void}) {
  if(!item) return null
  return <DrinkModalInner key={item.id||'new'} item={item} onClose={onClose} onSave={onSave}/>
}
function DrinkModalInner({item,onClose,onSave}:{item:DrinkDraft;onClose:()=>void;onSave:(item:DrinkDraft)=>void}) {
  const [draft,setDraft]=useState(item)
  return <Modal open={true} onClose={onClose} title={draft.id?'Edit Annex drink':'Add Annex drink'}><div className="grid gap-4">
    <input className="field-input" placeholder="Drink name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
    <select className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="">Select category</option>{DRINK_CATEGORIES.map(category=><option key={category} value={category}>{category}</option>)}</select>
    <input type="number" className="field-input" placeholder="Price" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/>
    <div><label className="field-label">Drink image</label><input className="field-input" placeholder="Image URL" value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})}/><ImageUploader folder="annex/drinks" label="Upload drink image" onUploaded={urls=>setDraft({...draft,image:urls[0]||''})}/></div>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.available} onChange={e=>setDraft({...draft,available:e.target.checked})}/>Available</label>
    <button className="btn-primary w-full justify-center" onClick={()=>onSave(draft)}><Save size={14}/>Save drink</button>
  </div></Modal>
}

function ShortLetModal({open,draft,onChange,onClose,onSave}:{open:boolean;draft:{name:string;type:string;price:string;bedrooms:string;amenities:string;image:string;description:string};onChange:(d:any)=>void;onClose:()=>void;onSave:()=>void}) {
  return <Modal open={open} onClose={onClose} title="Short-let property"><div className="grid gap-4">
    <input className="field-input" placeholder="Property name" value={draft.name} onChange={e=>onChange({...draft,name:e.target.value})}/>
    <div className="grid grid-cols-2 gap-4"><input className="field-input" placeholder="Type" value={draft.type} onChange={e=>onChange({...draft,type:e.target.value})}/><input type="number" className="field-input" placeholder="Bedrooms" value={draft.bedrooms} onChange={e=>onChange({...draft,bedrooms:e.target.value})}/></div>
    <input type="number" className="field-input" placeholder="Price / night" value={draft.price} onChange={e=>onChange({...draft,price:e.target.value})}/>
    <input className="field-input" placeholder="Amenities, comma separated" value={draft.amenities} onChange={e=>onChange({...draft,amenities:e.target.value})}/>
    <textarea rows={4} className="field-input !h-auto py-2.5" placeholder="Description" value={draft.description} onChange={e=>onChange({...draft,description:e.target.value})}/>
    <div><label className="field-label">Image URL</label><input className="field-input" value={draft.image} onChange={e=>onChange({...draft,image:e.target.value})}/><ImageUploader folder="annex/shortlets" label="Upload image" onUploaded={urls=>onChange({...draft,image:urls[0]||''})}/></div>
    <button className="btn-primary w-full justify-center" onClick={onSave}>Save property</button>
  </div></Modal>
}

function nairaOrder(value: number) { return '₦' + Number(value || 0).toLocaleString() }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="field-label">{label}</label>{children}</div>
}
