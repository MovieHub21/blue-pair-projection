'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapAmenity, mapDrink, mapMenuItem, mapShortLet } from '../../../lib/mappers'
import type { Drink, MenuItem, ShortLet } from '../../../data/mock'

type Amenity = {
  key: string; name: string; eyebrow: string; description: string; heroImage: string
  gallery: string[]; hours: string; facilities: string[]; pricingNote: string; ctaLabel: string; published: boolean
}
type BookingRow = {
  id: string; reference: string; customer_id: string; short_let_id: string; check_in: string
  check_out: string; amount: number; payment_status: string; status: string
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
const TABS = ['Content', 'Menu', 'Drinks', 'Short-lets', 'Bookings'] as const

function blankAmenity(key: string, name: string): Amenity {
  return { key, name, eyebrow: '', description: '', heroImage: '', gallery: [], hours: '', facilities: [], pricingNote: '', ctaLabel: 'Reserve now', published: false }
}

export default function AnnexManagement() {
  const [tab, setTab] = useState<typeof TABS[number]>('Content')
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [shortLets, setShortLets] = useState<ShortLet[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [selectedKey, setSelectedKey] = useState(OUTLETS[0].key)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null)
  const [editingShortLet, setEditingShortLet] = useState<ShortLet | null>(null)
  const [showAddShortLet, setShowAddShortLet] = useState(false)
  const [deleteShortLet, setDeleteShortLet] = useState<ShortLet | null>(null)
  const [saving, setSaving] = useState(false)

  const [amenityDraft, setAmenityDraft] = useState<Amenity>(blankAmenity(OUTLETS[0].key, OUTLETS[0].label))
  const [shortLetDraft, setShortLetDraft] = useState({ name: '', type: 'Apartment', price: '', bedrooms: '1', amenities: '', image: '', description: '' })

  const load = useCallback(async () => {
    const [a, m, d, s, b] = await Promise.all([
      supabase.from('amenities').select('*').like('key', 'annex-%').order('name'),
      supabase.from('menu_items').select('*').in('outlet', ['Annex Grilling', 'Annex Restaurant']).order('name'),
      supabase.from('drinks').select('*').eq('bar', 'Annex Bar').order('name'),
      supabase.from('short_lets').select('*').order('price'),
      supabase.from('bookings').select('id,reference,customer_id,short_let_id,check_in,check_out,amount,payment_status,status,customers(name,email)').not('short_let_id', 'is', null).order('created_at', { ascending: false }),
    ])
    if (a.data) setAmenities(a.data.map(mapAmenity))
    if (m.data) setMenuItems(m.data.map(mapMenuItem))
    if (d.data) setDrinks(d.data.map(mapDrink))
    if (s.data) setShortLets(s.data.map(mapShortLet))
    if (b.data) setBookings(b.data as BookingRow[])
  }, [])

  useEffect(() => {
    void load()
    const refresh = (e: Event) => {
      const table = (e as CustomEvent).detail?.table
      if (!table || ['amenities', 'menu_items', 'drinks', 'short_lets', 'bookings'].includes(table)) void load()
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [load])

  useEffect(() => {
    const found = amenities.find(a => a.key === selectedKey)
    setAmenityDraft(found ? { ...found } : blankAmenity(selectedKey, OUTLETS.find(x => x.key === selectedKey)?.label || selectedKey))
  }, [amenities, selectedKey])

  const selectedMenu = useMemo(() => menuItems, [menuItems])
  const selectedBookings = useMemo(() => bookings, [bookings])

  async function saveAmenity() {
    setSaving(true)
    const row = {
      key: amenityDraft.key, name: amenityDraft.name, eyebrow: amenityDraft.eyebrow,
      description: amenityDraft.description, hero_image: amenityDraft.heroImage,
      gallery: amenityDraft.gallery, hours: amenityDraft.hours, facilities: amenityDraft.facilities,
      pricing_note: amenityDraft.pricingNote, cta_label: amenityDraft.ctaLabel, published: amenityDraft.published,
    }
    const { error } = await supabase.from('amenities').upsert(row, { onConflict: 'key' })
    setSaving(false)
    if (error) return pushToast('Failed to save Annex content: ' + error.message, 'error')
    await load(); pushToast('Annex content saved', 'success')
  }

  async function saveMenu(item: MenuItem) {
    const { error } = await supabase.from('menu_items').update({
      outlet: item.outlet, category: item.category, name: item.name, price: item.price, image: item.image, available: item.available,
    }).eq('id', item.id)
    if (error) return pushToast('Failed to save menu item: ' + error.message, 'error')
    setEditingMenu(null); await load(); pushToast('Menu item saved', 'success')
  }

  async function saveDrink(item: Drink) {
    const { error } = await supabase.from('drinks').update({
      bar: item.bar, category: item.category, name: item.name, price: item.price, available: item.available,
    }).eq('id', item.id)
    if (error) return pushToast('Failed to save drink: ' + error.message, 'error')
    setEditingDrink(null); await load(); pushToast('Drink saved', 'success')
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
      : await supabase.from('short_lets').insert({ id: `sl_${Date.now()}`, ...patch, available: true })
    if (result.error) return pushToast('Failed to save short-let: ' + result.error.message, 'error')
    setEditingShortLet(null); setShowAddShortLet(false); await load(); pushToast('Short-let saved', 'success')
  }

  function editShortLet(sl: ShortLet) {
    setEditingShortLet(sl)
    setShortLetDraft({ name: sl.name, type: sl.type, price: String(sl.price), bedrooms: String(sl.bedrooms), amenities: sl.amenities.join(', '), image: sl.image, description: sl.description })
  }

  async function removeShortLet() {
    if (!deleteShortLet) return
    const { error } = await supabase.from('short_lets').delete().eq('id', deleteShortLet.id)
    if (error) return pushToast('Failed to delete property: ' + error.message, 'error')
    setDeleteShortLet(null); await load(); pushToast('Short-let deleted', 'success')
  }

  function newShortLet() {
    setEditingShortLet(null)
    setShortLetDraft({ name: '', type: 'Apartment', price: '', bedrooms: '1', amenities: '', image: '', description: '' })
    setShowAddShortLet(true)
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Annex Management</h1>
        <p className="text-sm text-navy-400 mt-1">All Annex business content is controlled here and stored in Supabase. Nothing on the public Annex pages is hardcoded.</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={'px-4 py-2.5 rounded-full text-sm font-semibold border ' + (tab === t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{t}</button>)}
      </div>

      {tab === 'Content' && (
        <div className="grid lg:grid-cols-[230px_minmax(0,1fr)] gap-5">
          <div className="card p-3 h-fit space-y-1">{OUTLETS.map(o => <button key={o.key} onClick={() => setSelectedKey(o.key)} className={'w-full text-left px-3 py-2.5 rounded-lg text-sm ' + (selectedKey === o.key ? 'bg-navy-950 text-white' : 'hover:bg-cream-100')}>{o.label}</button>)}</div>
          <div className="card p-5 sm:p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="field-label">Name</label><input className="field-input" value={amenityDraft.name} onChange={e => setAmenityDraft({...amenityDraft,name:e.target.value})}/></div>
              <div><label className="field-label">Eyebrow</label><input className="field-input" value={amenityDraft.eyebrow} onChange={e => setAmenityDraft({...amenityDraft,eyebrow:e.target.value})}/></div>
              <div className="md:col-span-2"><label className="field-label">Description</label><textarea rows={4} className="field-input !h-auto py-2.5" value={amenityDraft.description} onChange={e => setAmenityDraft({...amenityDraft,description:e.target.value})}/></div>
              <div><label className="field-label">Opening hours</label><input className="field-input" value={amenityDraft.hours} onChange={e => setAmenityDraft({...amenityDraft,hours:e.target.value})}/></div>
              <div><label className="field-label">Pricing note</label><input className="field-input" value={amenityDraft.pricingNote} onChange={e => setAmenityDraft({...amenityDraft,pricingNote:e.target.value})}/></div>
              <div><label className="field-label">CTA label</label><input className="field-input" value={amenityDraft.ctaLabel} onChange={e => setAmenityDraft({...amenityDraft,ctaLabel:e.target.value})}/></div>
              <div><label className="field-label">Facilities (one per line)</label><textarea rows={5} className="field-input !h-auto py-2.5" value={amenityDraft.facilities.join('\n')} onChange={e => setAmenityDraft({...amenityDraft,facilities:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})}/></div>
              <div className="md:col-span-2"><label className="field-label">Hero image</label><div className="flex gap-4 items-center"><div className="w-36 h-24 rounded-xl overflow-hidden bg-cream-100">{amenityDraft.heroImage && <img src={amenityDraft.heroImage} className="w-full h-full object-cover" alt=""/></div><ImageUploader folder={`annex/${amenityDraft.key}`} label="Upload image" onUploaded={urls=>setAmenityDraft({...amenityDraft,heroImage:urls[0]||''})}/></div></div>
              <div className="md:col-span-2"><label className="field-label">Gallery image URLs (one per line)</label><textarea rows={4} className="field-input !h-auto py-2.5" value={amenityDraft.gallery.join('\n')} onChange={e=>setAmenityDraft({...amenityDraft,gallery:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})}/></div>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={amenityDraft.published} onChange={e=>setAmenityDraft({...amenityDraft,published:e.target.checked})}/> Published on public Annex</label>
            </div>
            <button onClick={() => void saveAmenity()} disabled={saving} className="btn-primary mt-6"><Save size={14}/>{saving ? 'Saving…' : 'Save Annex content'}</button>
          </div>
        </div>
      )}

      {tab === 'Menu' && <ContentList title="Annex Grilling & Restaurant menu" items={selectedMenu.map(x => ({...x, edit: () => setEditingMenu(x)}))} />}
      {tab === 'Drinks' && <ContentList title="Annex Bar drinks" items={drinks.map(x => ({...x, edit: () => setEditingDrink(x)}))} />}

      {tab === 'Short-lets' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold">Annex short-let properties</h2>
              <p className="text-xs text-navy-400 mt-1">Properties, pricing, descriptions, images and amenities are editable here.</p>
            </div>
            <button onClick={newShortLet} className="btn-primary btn-sm"><Plus size={14} />Add property</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {shortLets.map((sl) => {
              const today = new Date().toISOString().slice(0, 10)
              const activeBooking = bookings.find(
                (b) =>
                  b.short_let_id === sl.id &&
                  ['confirmed', 'checked_in'].includes(b.status) &&
                  b.payment_status === 'paid' &&
                  b.check_in <= today &&
                  b.check_out > today,
              )
              const booked = Boolean(activeBooking)

              return (
                <div key={sl.id} className="card overflow-hidden grid grid-cols-[100px_minmax(0,1fr)]">
                  <img src={sl.image} className="w-full h-full min-h-[170px] object-cover" alt={sl.name} />
                  <div className="p-4 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <b>{sl.name}</b>
                        <p className="text-xs text-navy-400 mt-1">{sl.type} · {sl.bedrooms} bedrooms</p>
                      </div>
                      <span className={booked ? 'pill-red' : sl.available ? 'pill-green' : 'pill-red'}>
                        {booked ? 'Booked' : sl.available ? 'Available' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-3 line-clamp-2">{sl.description}</p>
                    <div className="font-display mt-3">
                      ₦{sl.price.toLocaleString()}
                      <span className="text-xs font-body text-navy-400"> /night</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => editShortLet(sl)} className="text-xs font-semibold flex items-center gap-1">
                        <Pencil size={12} />Edit
                      </button>
                      <button onClick={() => setDeleteShortLet(sl)} className="text-xs font-semibold text-red-600 flex items-center gap-1">
                        <Trash2 size={12} />Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {tab === 'Bookings' && <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Property</th><th className="p-4">Guest</th><th className="p-4">Dates</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Status</th></tr></thead><tbody>{selectedBookings.map(b => <tr key={b.id} className="border-b border-black/5"><td className="p-4 font-medium">{shortLets.find(s=>s.id===b.short_let_id)?.name || 'Short-let'}</td><td className="p-4">{b.customers?.name || b.customers?.email || 'Guest'}</td><td className="p-4">{b.check_in} → {b.check_out}</td><td className="p-4">₦{Number(b.amount).toLocaleString()}</td><td className="p-4 capitalize">{b.payment_status}</td><td className="p-4 capitalize">{b.status}</td></tr>)}{selectedBookings.length===0&&<tr><td colSpan={6} className="p-8 text-center text-navy-400">No short-let bookings yet.</td></tr>}</tbody></table></div>}

      <EditMenuModal item={editingMenu} onClose={()=>setEditingMenu(null)} onSave={saveMenu}/>
      <EditDrinkModal item={editingDrink} onClose={()=>setEditingDrink(null)} onSave={saveDrink}/>
      <ShortLetModal open={showAddShortLet || !!editingShortLet} draft={shortLetDraft} onChange={setShortLetDraft} onClose={()=>{setShowAddShortLet(false);setEditingShortLet(null)}} onSave={()=>void saveShortLet()}/>
      <DeleteConfirmDialog open={!!deleteShortLet} itemName={deleteShortLet?.name} description="This short-let will be permanently removed." onCancel={()=>setDeleteShortLet(null)} onConfirm={()=>void removeShortLet()}/>
    </div>
  )
}

function ContentList({ title, items }: { title: string; items: Array<any> }) {
  return <div className="card divide-y divide-black/5"><div className="p-5"><h2 className="font-semibold">{title}</h2></div>{items.map(item => <div key={item.id} className="p-4 flex items-center gap-4"><img src={item.image} className="w-16 h-14 rounded-lg object-cover bg-cream-100" alt=""/><div className="flex-1 min-w-0"><b className="block truncate">{item.name}</b><span className="text-xs text-navy-400">{item.category} · ₦{Number(item.price).toLocaleString()}</span></div><span className={item.available?'pill-green':'pill-red'}>{item.available?'Available':'Sold out'}</span><button onClick={item.edit} className="text-xs font-semibold"><Pencil size={13}/></button></div>)}</div>
}

function EditMenuModal({ item, onClose, onSave }: { item: MenuItem|null; onClose:()=>void; onSave:(x:MenuItem)=>void }) {
  const [draft,setDraft]=useState<MenuItem|null>(null)
  useEffect(()=>setDraft(item?{...item}:null),[item])
  return <Modal open={!!item} onClose={onClose} title="Edit Annex menu item">{draft&&<div className="grid gap-4"><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:Number(e.target.value)})}/><input className="field-input" value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})}/><label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.available} onChange={e=>setDraft({...draft,available:e.target.checked})}/> Available</label><button className="btn-primary" onClick={()=>onSave(draft)}>Save</button></div>}</Modal>
}

function EditDrinkModal({ item, onClose, onSave }: { item: Drink|null; onClose:()=>void; onSave:(x:Drink)=>void }) {
  const [draft,setDraft]=useState<Drink|null>(null)
  useEffect(()=>setDraft(item?{...item}:null),[item])
  return <Modal open={!!item} onClose={onClose} title="Edit Annex drink">{draft&&<div className="grid gap-4"><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:Number(e.target.value)})}/><input className="field-input" value={draft.bar} onChange={e=>setDraft({...draft,bar:e.target.value})}/><label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.available} onChange={e=>setDraft({...draft,available:e.target.checked})}/> Available</label><button className="btn-primary" onClick={()=>onSave(draft)}>Save</button></div>}</Modal>
}

function ShortLetModal({ open, draft, onChange, onClose, onSave }: { open:boolean; draft:any; onChange:(x:any)=>void; onClose:()=>void; onSave:()=>void }) {
  return <Modal open={open} onClose={onClose} title="Short-let property"><div className="grid gap-4"><input className="field-input" placeholder="Property name" value={draft.name} onChange={e=>onChange({...draft,name:e.target.value})}/><div className="grid grid-cols-2 gap-4"><input className="field-input" placeholder="Type" value={draft.type} onChange={e=>onChange({...draft,type:e.target.value})}/><input type="number" className="field-input" placeholder="Bedrooms" value={draft.bedrooms} onChange={e=>onChange({...draft,bedrooms:e.target.value})}/></div><input type="number" className="field-input" placeholder="Price / night" value={draft.price} onChange={e=>onChange({...draft,price:e.target.value})}/><input className="field-input" placeholder="Amenities, comma separated" value={draft.amenities} onChange={e=>onChange({...draft,amenities:e.target.value})}/><textarea rows={4} className="field-input !h-auto py-2.5" placeholder="Description" value={draft.description} onChange={e=>onChange({...draft,description:e.target.value})}/><div><label className="field-label">Image URL</label><input className="field-input" value={draft.image} onChange={e=>onChange({...draft,image:e.target.value})}/><ImageUploader folder="annex/shortlets" label="Upload image" onUploaded={urls=>onChange({...draft,image:urls[0]||''})}/></div><button className="btn-primary w-full justify-center" onClick={onSave}>Save property</button></div></Modal>
}
