'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Power, X } from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'
import type { RoomType } from '../../../data/mock'

type Unit = { id:string; room_number:string; room_type_id:string; floor:string; status:string; name:string; slug:string; image_url:string|null }
type TypeDraft = { name:string; category:string; price:string; guests:string; bedType:string; sizeSqm:string; description:string; amenities:string; images:string[]; active:boolean }
type UnitDraft = { number:string; floor:string; name:string; image:string|null }

const slugify = (s:string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
const emptyType:TypeDraft = { name:'', category:'', price:'', guests:'2', bedType:'King bed', sizeSqm:'30', description:'', amenities:'Free WiFi, Air conditioning', images:[], active:true }
const emptyUnit:UnitDraft = { number:'', floor:'1', name:'', image:null }

export default function RoomManagement(){
  const [types,setTypes] = useState<RoomType[]>([])
  const [units,setUnits] = useState<Unit[]>([])
  const [open,setOpen] = useState<string|null>(null)
  const [typeModal,setTypeModal] = useState(false)
  const [editingType,setEditingType] = useState<string|null>(null)
  const [unitModal,setUnitModal] = useState<string|null>(null)
  const [editingUnit,setEditingUnit] = useState<string|null>(null)
  const [draft,setDraft] = useState<TypeDraft>(emptyType)
  const [unit,setUnit] = useState<UnitDraft>(emptyUnit)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState<string|null>(null)

  const load = async () => {
    const [{data:t,error:te},{data:r,error:re}] = await Promise.all([
      supabase.from('room_types').select('*').order('category').order('price'),
      supabase.from('rooms').select('*').order('room_number'),
    ])
    if(te || re){ setMessage(te?.message || re?.message || 'Could not load rooms.'); return }
    setTypes((t??[]).map((x:any)=>({...x,bedType:x.bed_type,sizeSqm:x.size_sqm})))
    setUnits(r??[])
  }
  useEffect(()=>{ void load() },[])

  const categories = useMemo(()=>Array.from(new Set(types.map(t=>t.category).filter(Boolean))).sort(),[types])
  const grouped = useMemo(()=>categories.map(c=>({c,items:types.filter(t=>t.category===c)})),[types,categories])

  function startCreateType(){ setEditingType(null); setDraft({...emptyType}); setTypeModal(true); setMessage(null) }
  function startEditType(t:RoomType){ setEditingType(t.id); setDraft({name:t.name,category:t.category,price:String(t.price),guests:String(t.guests),bedType:t.bedType,sizeSqm:String(t.sizeSqm),description:t.description,amenities:t.amenities.join(', '),images:t.images??[],active:t.active}); setTypeModal(true); setMessage(null) }
  function closeType(){ if(!busy){setTypeModal(false);setEditingType(null)} }

  async function saveType(){
    const name=draft.name.trim(), category=draft.category.trim()
    if(!name || !category){setMessage('Room type name and section/category are required.');return}
    const slug=slugify(name)
    if(!slug){setMessage('Use a valid room type name.');return}
    setBusy(true);setMessage(null)
    const row={slug,name,category,price:Number(draft.price)||0,guests:Math.max(1,Number(draft.guests)||1),bed_type:draft.bedType.trim(),size_sqm:Math.max(0,Number(draft.sizeSqm)||0),amenities:draft.amenities.split(',').map(x=>x.trim()).filter(Boolean),images:draft.images,description:draft.description.trim(),active:draft.active}
    const result=editingType
      ? await supabase.from('room_types').update(row).eq('id',editingType)
      : await supabase.from('room_types').insert({id:`rt_${Date.now()}`,...row})
    setBusy(false)
    if(result.error){setMessage(result.error.message);return}
    closeType(); await load()
  }

  async function deleteType(t:RoomType){
    const count=units.filter(u=>u.room_type_id===t.id).length
    if(!confirm(count ? `Delete ${t.name}? This will also delete its ${count} physical room(s).` : `Delete ${t.name}?`)) return
    setBusy(true);setMessage(null)
    const {error}=await supabase.from('room_types').delete().eq('id',t.id)
    setBusy(false)
    if(error){setMessage(`Could not delete ${t.name}. ${error.message}. If it has booking history, disable it instead to preserve those records.`);return}
    if(open===t.id)setOpen(null)
    await load()
  }

  async function toggleType(t:RoomType){
    const {error}=await supabase.from('room_types').update({active:!t.active}).eq('id',t.id)
    if(error)setMessage(error.message); else await load()
  }

  function startAddUnit(typeId:string){setEditingUnit(null);setUnitModal(typeId);setUnit({...emptyUnit});setMessage(null)}
  function startEditUnit(typeId:string,r:Unit){setEditingUnit(r.id);setUnitModal(typeId);setUnit({number:r.room_number,floor:r.floor,name:r.name,image:r.image_url});setMessage(null)}
  function closeUnit(){if(!busy){setUnitModal(null);setEditingUnit(null)}}

  async function saveUnit(){
    if(!unitModal || !unit.number.trim()){setMessage('Room number is required.');return}
    const name=unit.name.trim() || `Room ${unit.number.trim()}`
    const slug=slugify(`${name}-${unit.number}`)
    setBusy(true);setMessage(null)
    const row={room_number:unit.number.trim(),floor:unit.floor.trim()||'1',name,slug,image_url:unit.image||null}
    const result=editingUnit
      ? await supabase.from('rooms').update(row).eq('id',editingUnit)
      : await supabase.from('rooms').insert({id:`room_${Date.now()}`,room_type_id:unitModal,status:'available',...row})
    setBusy(false)
    if(result.error){setMessage(result.error.message);return}
    closeUnit(); await load()
  }

  async function deleteUnit(r:Unit){
    if(!confirm(`Delete physical room ${r.room_number}?`))return
    const {error}=await supabase.from('rooms').delete().eq('id',r.id)
    if(error){setMessage(`Could not delete room ${r.room_number}. ${error.message}`);return}
    await load()
  }

  return <div className="max-w-6xl">
    <div className="flex items-start justify-between gap-4 mb-8"><div><h1 className="text-2xl font-semibold">Room Management</h1><p className="text-sm text-navy-400 mt-1">Create, edit, disable and remove room types and their physical rooms. Sections are created from the category you enter — nothing is hard-coded.</p></div><button className="btn-primary btn-sm" onClick={startCreateType}><Plus size={14}/>New room type</button></div>
    {message&&<div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">{message}</div>}

    {grouped.map(g=><section key={g.c} className="mb-8"><div className="flex items-center gap-3 mb-3"><h2 className="text-xs uppercase tracking-[.18em] text-navy-400">{g.c}</h2><span className="text-xs text-navy-300">{g.items.length} type{g.items.length!==1?'s':''}</span></div><div className="space-y-3">{g.items.map(t=>{const children=units.filter(u=>u.room_type_id===t.id);const is=open===t.id;return <div key={t.id} className="card overflow-hidden">
      <div className="p-4 flex items-center gap-4"><button onClick={()=>setOpen(is?null:t.id)} className="flex items-center gap-4 text-left flex-1 min-w-0"><img src={t.images?.[0]} className="w-16 h-14 rounded-lg object-cover shrink-0" alt=""/><div className="min-w-0"><b className="block truncate">{t.name}</b><div className="text-xs text-navy-400 mt-1">₦{Number(t.price).toLocaleString()} / night · max {t.guests} guests · {children.length} physical rooms</div></div></button><span className={t.active?'pill-green':'pill-red'}>{t.active?'Active':'Disabled'}</span><div className="flex items-center gap-1"><button title="Edit room type" className="p-2 rounded-lg hover:bg-cream-100" onClick={()=>startEditType(t)}><Pencil size={15}/></button><button title={t.active?'Disable room type':'Enable room type'} className="p-2 rounded-lg hover:bg-cream-100" onClick={()=>toggleType(t)}><Power size={15}/></button><button title="Delete room type" className="p-2 rounded-lg hover:bg-red-50 text-red-600" onClick={()=>deleteType(t)}><Trash2 size={15}/></button><button onClick={()=>setOpen(is?null:t.id)} className="p-2">{is?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</button></div></div>
      {is&&<div className="border-t border-black/5 bg-cream-50/50 p-4"><div className="grid md:grid-cols-2 gap-3">{children.map(r=><div key={r.id} className="bg-white border border-black/5 rounded-xl p-3 flex items-center gap-3"><img src={r.image_url||t.images?.[0]} className="w-14 h-12 rounded-lg object-cover" alt=""/><div className="flex-1 min-w-0"><b className="text-sm block truncate">{r.name}</b><div className="text-xs text-navy-400">Room {r.room_number} · Floor {r.floor}</div></div><span className={r.status==='available'?'pill-green':'pill-red'}>{r.status.replace('_',' ')}</span><button title="Edit room" className="p-2 rounded-lg hover:bg-cream-100" onClick={()=>startEditUnit(t.id,r)}><Pencil size={14}/></button><button title="Delete room" className="p-2 rounded-lg hover:bg-red-50 text-red-600" onClick={()=>deleteUnit(r)}><Trash2 size={14}/></button></div>)}</div><button className="btn-outline btn-sm mt-4" onClick={()=>startAddUnit(t.id)}><Plus size={13}/>Add room {t.name}</button></div>}
    </div>})}</div></section>)}
    {grouped.length===0&&<div className="card p-12 text-center text-sm text-navy-400">No room types yet. Create your first type.</div>}

    {typeModal&&<div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center"><div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-auto"><div className="flex justify-between items-start mb-6"><div><h2 className="text-xl font-semibold">{editingType?'Edit room type':'Create room type'}</h2><p className="text-sm text-navy-400 mt-1">This is a real database room type. Its section/category is also created dynamically from what you enter.</p></div><button onClick={closeType} className="p-2"><X size={18}/></button></div><div className="grid md:grid-cols-2 gap-4"><input className="field-input md:col-span-2" placeholder="Room type name e.g. Presidential Suite" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><div><label className="field-label">Room section / category</label><input list="room-categories" className="field-input" placeholder="e.g. Presidential" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/><datalist id="room-categories">{categories.map(c=><option key={c} value={c}/>)}</datalist></div><input className="field-input" type="number" min="0" placeholder="Price / night" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/><input className="field-input" type="number" min="1" placeholder="Maximum guests" value={draft.guests} onChange={e=>setDraft({...draft,guests:e.target.value})}/><input className="field-input" placeholder="Bed type" value={draft.bedType} onChange={e=>setDraft({...draft,bedType:e.target.value})}/><input className="field-input" type="number" min="0" placeholder="Size m²" value={draft.sizeSqm} onChange={e=>setDraft({...draft,sizeSqm:e.target.value})}/><textarea className="field-input md:col-span-2 min-h-28" placeholder="Full room description" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/><input className="field-input md:col-span-2" placeholder="Amenities separated by commas" value={draft.amenities} onChange={e=>setDraft({...draft,amenities:e.target.value})}/><div className="md:col-span-2"><ImageUploader folder="rooms/types" multiple label="Upload room type photos" onUploaded={urls=>setDraft({...draft,images:[...draft.images,...urls]})}/></div><label className="md:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/> Show this room type publicly</label></div><div className="flex gap-3 justify-end mt-6"><button className="btn-outline" onClick={closeType}>Cancel</button><button className="btn-primary" disabled={busy} onClick={saveType}>{busy?'Saving…':editingType?'Save changes':'Create room type'}</button></div></div></div>}

    {unitModal&&<div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center"><div className="bg-white rounded-2xl w-full max-w-lg p-6"><div className="flex justify-between items-start mb-5"><div><h2 className="text-xl font-semibold">{editingUnit?'Edit physical room':'Add physical room'}</h2><p className="text-sm text-navy-400 mt-1">This room inherits its type's price, capacity, amenities and description.</p></div><button onClick={closeUnit} className="p-2"><X size={18}/></button></div><input className="field-input mb-3" placeholder="Room number e.g. 204" value={unit.number} onChange={e=>setUnit({...unit,number:e.target.value})}/><input className="field-input mb-3" placeholder="Room display name e.g. Garden View 204" value={unit.name} onChange={e=>setUnit({...unit,name:e.target.value})}/><input className="field-input mb-4" placeholder="Floor" value={unit.floor} onChange={e=>setUnit({...unit,floor:e.target.value})}/><ImageUploader folder={`rooms/${unitModal}`} label="Room-specific image" onUploaded={urls=>setUnit({...unit,image:urls[0]})}/><div className="flex gap-3 justify-end mt-6"><button className="btn-outline" onClick={closeUnit}>Cancel</button><button className="btn-primary" disabled={busy} onClick={saveUnit}>{busy?'Saving…':editingUnit?'Save room':'Add room'}</button></div></div></div>}
  </div>
}
