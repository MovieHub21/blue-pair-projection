'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Power, X } from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import type { RoomType } from '../../../data/mock'

type Unit = { id:string; room_number:string; room_type_id:string; floor:string; status:string; name:string; slug:string; image_url:string|null; images:string[] }
type TypeDraft = { name:string; price:string; guests:string; bedType:string; sizeSqm:string; description:string; amenities:string; images:string[]; active:boolean }
type UnitDraft = { number:string; floor:string; name:string; images:string[] }
type DeleteTarget = { kind:'type'; item:RoomType; childCount:number } | { kind:'unit'; item:Unit } | null

const slugify = (s:string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
const emptyType:TypeDraft = { name:'', price:'', guests:'2', bedType:'King bed', sizeSqm:'30', description:'', amenities:'Free WiFi, Air conditioning', images:[], active:true }
const emptyUnit:UnitDraft = { number:'', floor:'1', name:'', images:[] }

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
  const [deleteTarget,setDeleteTarget] = useState<DeleteTarget>(null)

  const load = async () => {
    const [{data:t,error:te},{data:r,error:re}] = await Promise.all([
      supabase.from('room_types').select('*').order('price'),
      supabase.from('rooms').select('*').order('room_number'),
    ])
    if(te || re){ setMessage(te?.message || re?.message || 'Could not load rooms.'); return }
    setTypes((t??[]).map((x:any)=>({...x,bedType:x.bed_type,sizeSqm:x.size_sqm})) as RoomType[])
    setUnits((r??[]).map((x:any)=>({...x,images:Array.from(new Set([...(x.images||[]),x.image_url].filter(Boolean))).slice(0,3)})) as Unit[])
  }
  useEffect(()=>{ void load() },[])

  function startCreateType(){ setEditingType(null); setDraft({...emptyType}); setTypeModal(true); setMessage(null) }
  function startEditType(t:RoomType){ setEditingType(t.id); setDraft({name:t.name,price:String(t.price),guests:String(t.guests),bedType:t.bedType,sizeSqm:String(t.sizeSqm),description:t.description,amenities:t.amenities.join(', '),images:t.images??[],active:t.active}); setTypeModal(true); setMessage(null) }
  function closeType(){ if(!busy){setTypeModal(false);setEditingType(null)} }

  async function saveType(){
    const name=draft.name.trim()
    if(!name){setMessage('Room type name is required.');return}
    const slug=slugify(name)
    if(!slug){setMessage('Use a valid room type name.');return}
    setBusy(true);setMessage(null)
    const row={slug,name,price:Number(draft.price)||0,guests:Math.max(1,Number(draft.guests)||1),bed_type:draft.bedType.trim(),size_sqm:Math.max(0,Number(draft.sizeSqm)||0),amenities:draft.amenities.split(',').map(x=>x.trim()).filter(Boolean),images:draft.images,description:draft.description.trim(),active:draft.active}
    const result=editingType ? await supabase.from('room_types').update(row).eq('id',editingType) : await supabase.from('room_types').insert({id:`rt_${Date.now()}`,...row})
    setBusy(false)
    if(result.error){setMessage(result.error.message);return}
    closeType(); await load()
  }

  function requestDeleteType(t:RoomType){
    const count=units.filter(u=>u.room_type_id===t.id).length
    setDeleteTarget({kind:'type',item:t,childCount:count})
  }

  async function deleteType(t:RoomType){
    setBusy(true);setMessage(null)
    const {error}=await supabase.from('room_types').delete().eq('id',t.id)
    setBusy(false)
    if(error){setMessage(`Could not delete ${t.name}. ${error.message}. If it has booking history, disable it instead to preserve those records.`);throw error}
    if(open===t.id)setOpen(null)
    await load()
  }

  async function deleteUnit(r:Unit){
    const {error}=await supabase.from('rooms').delete().eq('id',r.id)
    if(error){setMessage(`Could not delete room ${r.room_number}. ${error.message}`);throw error}
    await load()
  }

  async function toggleType(t:RoomType){ const {error}=await supabase.from('room_types').update({active:!t.active}).eq('id',t.id); if(error)setMessage(error.message); else await load() }
  function startAddUnit(typeId:string){setEditingUnit(null);setUnitModal(typeId);setUnit({...emptyUnit});setMessage(null)}
  function startEditUnit(typeId:string,r:Unit){setEditingUnit(r.id);setUnitModal(typeId);setUnit({number:r.room_number,floor:r.floor,name:r.name,images:Array.from(new Set([...(r.images||[]),r.image_url].filter(Boolean) as string[])).slice(0,3)});setMessage(null)}
  function closeUnit(){if(!busy){setUnitModal(null);setEditingUnit(null)}}
  async function saveUnit(){
    if(!unitModal || !unit.number.trim()){setMessage('Room number is required.');return}
    const name=unit.name.trim() || `Room ${unit.number.trim()}`
    const slug=slugify(`${name}-${unit.number}`)
    const images=Array.from(new Set(unit.images.filter(Boolean))).slice(0,3)
    setBusy(true);setMessage(null)
    const row={room_number:unit.number.trim(),floor:unit.floor.trim()||'1',name,slug,image_url:images[0]||null,images}
    const roomsTable = supabase.from('rooms') as any
    const result=editingUnit ? await roomsTable.update(row).eq('id',editingUnit) : await roomsTable.insert({id:`room_${Date.now()}`,room_type_id:unitModal,status:'available',...row})
    setBusy(false)
    if(result.error){setMessage(result.error.message);return}
    closeUnit(); await load()
  }

  const targetName = deleteTarget?.kind === 'type' ? deleteTarget.item.name : deleteTarget?.item.name
  const targetDescription = deleteTarget?.kind === 'type'
    ? deleteTarget.childCount ? `This will also remove ${deleteTarget.childCount} physical room${deleteTarget.childCount === 1 ? '' : 's'}. This action cannot be undone.` : 'This room type will be permanently removed.'
    : 'This physical room will be permanently removed from the room inventory.'

  return <div className="max-w-6xl">
    <div className="flex items-start justify-between gap-4 mb-8"><div><h1 className="text-2xl font-semibold">Room Management</h1><p className="text-sm text-navy-400 mt-1">Each room type is its own category. Create Standard, Deluxe, Presidential, Penthouse or any other type, then add the physical rooms underneath it.</p></div><button className="btn-primary btn-sm" onClick={startCreateType}><Plus size={14}/>New room type</button></div>
    {message&&<div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">{message}</div>}
    <div className="space-y-5">{types.map(t=>{const children=units.filter(u=>u.room_type_id===t.id);const is=open===t.id;return <section key={t.id} className="card overflow-hidden">
      <div className="p-3 sm:p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4"><button onClick={()=>setOpen(is?null:t.id)} className="contents text-left"><img src={t.images?.[0]} className="w-14 h-12 sm:w-16 sm:h-14 rounded-lg object-cover shrink-0" alt=""/><div className="min-w-0"><b className="block truncate text-base">{t.name}</b><div className="text-xs text-navy-400 mt-1 truncate">₦{Number(t.price).toLocaleString()} / night · max {t.guests} guests · {children.length} room{children.length!==1?'s':''}</div></div></button><div className="flex items-center gap-1.5 col-start-3 row-start-1"><span className={`hidden sm:inline-flex ${t.active?'pill-green':'pill-red'}`}>{t.active?'Active':'Disabled'}</span><span aria-label={t.active?'Active':'Disabled'} title={t.active?'Active':'Disabled'} className={`sm:hidden w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${t.active?'bg-emerald-500':'bg-red-500'}`} /><div className="flex items-center gap-0.5"><button title="Edit room type" className="p-1.5 rounded-lg hover:bg-cream-100" onClick={()=>startEditType(t)}><Pencil size={14}/></button><button title={t.active?'Disable room type':'Enable room type'} className="p-1.5 rounded-lg hover:bg-cream-100" onClick={()=>toggleType(t)}><Power size={14}/></button><button title="Delete room type" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" onClick={()=>requestDeleteType(t)}><Trash2 size={14}/></button><button onClick={()=>setOpen(is?null:t.id)} className="p-1.5">{is?<ChevronDown size={17}/>:<ChevronRight size={17}/>}</button></div></div></div>
      {is&&<div className="border-t border-black/5 bg-cream-50/50 p-3 sm:p-4"><div className="grid md:grid-cols-2 gap-3">{children.map(r=><div key={r.id} className="bg-white border border-black/5 rounded-xl p-2.5 sm:p-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5"><img src={r.images?.[0]||r.image_url||t.images?.[0]} className="w-12 h-11 sm:w-14 sm:h-12 rounded-lg object-cover" alt=""/><div className="min-w-0"><b className="text-sm block truncate">{r.name}</b><div className="text-xs text-navy-400 truncate">Room {r.room_number} · Floor {r.floor}{r.images?.length ? ` · ${r.images.length}/3 photos` : ''}</div></div><div className="flex items-center gap-0.5"><span className={`hidden sm:inline-flex ${r.status==='available'?'pill-green':'pill-red'}`}>{r.status.replace('_',' ')}</span><span aria-label={r.status.replace('_',' ')} title={r.status.replace('_',' ')} className={`sm:hidden w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${r.status==='available'?'bg-emerald-500':'bg-red-500'}`} /><button title="Edit room" className="p-1.5 rounded-lg hover:bg-cream-100" onClick={()=>startEditUnit(t.id,r)}><Pencil size={13}/></button><button title="Delete room" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" onClick={()=>setDeleteTarget({kind:'unit',item:r})}><Trash2 size={13}/></button></div></div>)}</div><button className="btn-outline btn-sm mt-4" onClick={()=>startAddUnit(t.id)}><Plus size={13}/>Add room to {t.name}</button></div>}
    </section>})}</div>
    {types.length===0&&<div className="card p-12 text-center text-sm text-navy-400">No room types yet. Create your first one.</div>}

    {typeModal&&<div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center"><div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-auto"><div className="flex justify-between items-start mb-6"><div><h2 className="text-xl font-semibold">{editingType?'Edit room type':'Create room type'}</h2><p className="text-sm text-navy-400 mt-1">This creates the room type itself. Its description, amenities, capacity, pricing and images belong to this type and are inherited by its rooms.</p></div><button onClick={closeType} className="p-2"><X size={18}/></button></div><div className="grid md:grid-cols-2 gap-4"><input className="field-input md:col-span-2" placeholder="Room type name e.g. Standard, Deluxe, Presidential Suite" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input className="field-input" type="number" min="0" placeholder="Price / night" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/><input className="field-input" type="number" min="1" placeholder="Maximum guests" value={draft.guests} onChange={e=>setDraft({...draft,guests:e.target.value})}/><input className="field-input" placeholder="Bed type" value={draft.bedType} onChange={e=>setDraft({...draft,bedType:e.target.value})}/><input className="field-input" type="number" min="0" placeholder="Size m²" value={draft.sizeSqm} onChange={e=>setDraft({...draft,sizeSqm:e.target.value})}/><textarea className="field-input md:col-span-2 min-h-28" placeholder="Full room type description" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/><input className="field-input md:col-span-2" placeholder="Amenities separated by commas" value={draft.amenities} onChange={e=>setDraft({...draft,amenities:e.target.value})}/><div className="md:col-span-2"><ImageUploader folder="rooms/types" multiple label="Upload room type photos" onUploaded={urls=>setDraft({...draft,images:[...draft.images,...urls]})}/></div><label className="md:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/> Show this room type publicly</label></div><div className="flex gap-3 justify-end mt-6"><button className="btn-outline" onClick={closeType}>Cancel</button><button className="btn-primary" disabled={busy} onClick={saveType}>{busy?'Saving…':editingType?'Save changes':'Create room type'}</button></div></div></div>}
    {unitModal&&<div className="fixed inset-0 z-50 bg-black/50 p-4 grid place-items-center"><div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-auto"><div className="flex justify-between items-start mb-5"><div><h2 className="text-xl font-semibold">{editingUnit?'Edit physical room':'Add physical room'}</h2><p className="text-sm text-navy-400 mt-1">This room belongs to <b>{types.find(t=>t.id===unitModal)?.name}</b> and inherits its price, capacity, amenities and description.</p></div><button onClick={closeUnit} className="p-2"><X size={18}/></button></div><input className="field-input mb-3" placeholder="Room number e.g. 101" value={unit.number} onChange={e=>setUnit({...unit,number:e.target.value})}/><input className="field-input mb-3" placeholder="Room display name e.g. Standard 101" value={unit.name} onChange={e=>setUnit({...unit,name:e.target.value})}/><input className="field-input mb-4" placeholder="Floor" value={unit.floor} onChange={e=>setUnit({...unit,floor:e.target.value})}/><div className="rounded-xl border border-gold-500/15 bg-gold-50/60 p-3 mb-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-navy-900">Room gallery</p><p className="text-[11px] text-navy-500 mt-0.5">Add up to 3 photos showing different sides of this exact room.</p></div><span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-navy-700 border border-black/5">{unit.images.length}/3</span></div><div className="mt-3">{unit.images.length < 3 ? <ImageUploader folder={`rooms/${unitModal}`} multiple maxFiles={3-unit.images.length} label={`Add photo${3-unit.images.length===1?'':'s'}`} onUploaded={urls=>setUnit({...unit,images:Array.from(new Set([...unit.images,...urls])).slice(0,3)})}/> : <p className="text-[11px] font-medium text-emerald-700">Maximum of 3 room photos reached.</p>}</div></div>{unit.images.length>0&&<div className="mt-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Room photos</span><span className="text-xs text-navy-400">Drag-free gallery · click × to remove</span></div><div className="grid grid-cols-3 gap-2">{unit.images.map((url,index)=><div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-cream-50"><img src={url} className="w-full h-full object-cover" alt={`Room ${unit.number || 'photo'} ${index+1}`}/><button type="button" title="Remove photo" onClick={()=>setUnit({...unit,images:unit.images.filter((_,i)=>i!==index)})} className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-full bg-black/65 text-white hover:bg-black/80"><X size={14}/></button>{index===0&&<span className="absolute left-1.5 bottom-1.5 rounded-md bg-black/65 text-white px-2 py-1 text-[10px] font-medium">Primary</span>}</div>)}</div></div>}<div className="flex gap-3 justify-end mt-6"><button className="btn-outline" onClick={closeUnit}>Cancel</button><button className="btn-primary" disabled={busy} onClick={saveUnit}>{busy?'Saving…':editingUnit?'Save room':'Add room'}</button></div></div></div>}
    <DeleteConfirmDialog open={!!deleteTarget} itemName={targetName} description={targetDescription} onCancel={()=>setDeleteTarget(null)} onConfirm={async()=>{ if(!deleteTarget)return; if(deleteTarget.kind==='type') await deleteType(deleteTarget.item); else await deleteUnit(deleteTarget.item) }} />
  </div>
}
