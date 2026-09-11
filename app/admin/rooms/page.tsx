'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import EditablePrice from '../../../components/admin/EditablePrice'
import ImageUploader from '../../../components/admin/ImageUploader'
import Modal from '../../../components/ui/Modal'
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { RoomType } from '../../../data/mock'

export default function RoomManagement() {
  const { roomTypes, updateRoomTypePrice, toggleRoomTypeActive, addRoomType, setRoomTypeImages, rooms } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [imagesFor, setImagesFor] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', category: 'Standard', price: '', guests: '2', bedType: 'King bed', sizeSqm: '30' })
  const [draftImages, setDraftImages] = useState<string[]>([])

  const editing = roomTypes.find(rt => rt.id === imagesFor) ?? null

  function submitAdd() {
    const rt: RoomType = {
      id: `rt_${Date.now()}`, slug: (draft.name || 'new-room').toLowerCase().replace(/\s+/g,'-'), name: draft.name || 'New Room Type',
      category: draft.category as RoomType['category'], price: Number(draft.price) || 50000, guests: Number(draft.guests),
      bedType: draft.bedType, sizeSqm: Number(draft.sizeSqm), amenities: ['Free WiFi','Air conditioning'],
      images: draftImages.length ? draftImages : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'],
      description: 'A newly added room type — description pending final copy.', active: true,
    }
    addRoomType(rt)
    setShowAdd(false)
    setDraft({ name: '', category: 'Standard', price: '', guests: '2', bedType: 'King bed', sizeSqm: '30' })
    setDraftImages([])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Room Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add room</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Room type</th><th className="p-4">Category</th><th className="p-4">Price / night</th>
            <th className="p-4">Guests</th><th className="p-4">Units</th><th className="p-4">Status</th><th className="p-4">Actions</th>
          </tr></thead>
          <tbody>
            {roomTypes.map(rt => {
              const unitCount = rooms.filter(r => r.roomTypeId === rt.id).length
              return (
                <tr key={rt.id} className="border-b border-black/5 last:border-none">
                  <td className="p-4"><div className="flex items-center gap-3"><img src={rt.images[0]} className="w-12 h-12 rounded-lg object-cover" alt={rt.name} /><b>{rt.name}</b></div></td>
                  <td className="p-4 text-navy-500">{rt.category}</td>
                  <td className="p-4"><EditablePrice value={rt.price} onSave={v => updateRoomTypePrice(rt.id, v)} /></td>
                  <td className="p-4 text-navy-500">{rt.guests}</td>
                  <td className="p-4 text-navy-500">{unitCount || '—'}</td>
                  <td className="p-4"><span className={rt.active ? 'pill-green' : 'pill-red'}>{rt.active ? 'Active' : 'Disabled'}</span></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => setImagesFor(rt.id)} className="text-xs font-semibold text-navy-900 flex items-center gap-1"><ImageIcon size={12}/>Photos ({rt.images.length})</button>
                      <button onClick={() => toggleRoomTypeActive(rt.id)} className="text-xs font-semibold text-red-600">{rt.active ? 'Disable' : 'Enable'}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setImagesFor(null)} title={editing ? `${editing.name} photos` : 'Photos'} subtitle="Upload photos from your device. The first photo is used as the main image on the website.">
        {editing && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {editing.images.map((src, i) => (
                <div key={src + i} className="relative h-28 rounded-lg overflow-hidden group">
                  <img src={src} className="w-full h-full object-cover" alt={`${editing.name} photo ${i+1}`} />
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-navy-950/80 text-white px-1.5 py-0.5 rounded">Main</span>}
                  <button onClick={() => setRoomTypeImages(editing.id, editing.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
              ))}
              {editing.images.length === 0 && <p className="col-span-3 text-sm text-navy-400">No photos yet.</p>}
            </div>
            <ImageUploader folder={`rooms/${editing.id}`} multiple label="Upload photos from device"
              onUploaded={urls => setRoomTypeImages(editing.id, [...editing.images, ...urls])} />
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add room type" subtitle="This will appear on the public Rooms page immediately.">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="field-label">Room name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Garden Suite" /></div>
          <div><label className="field-label">Category</label><select className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>
            {['Standard','Deluxe','Executive','Premium','Suite','VIP Suite'].map(c=><option key={c}>{c}</option>)}
          </select></div>
          <div><label className="field-label">Price / night (₦)</label><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="95000" /></div>
          <div><label className="field-label">Guests</label><input type="number" className="field-input" value={draft.guests} onChange={e=>setDraft({...draft,guests:e.target.value})} /></div>
          <div><label className="field-label">Bed type</label><input className="field-input" value={draft.bedType} onChange={e=>setDraft({...draft,bedType:e.target.value})} /></div>
          <div><label className="field-label">Size (m²)</label><input type="number" className="field-input" value={draft.sizeSqm} onChange={e=>setDraft({...draft,sizeSqm:e.target.value})} /></div>
          <div className="col-span-2">
            <label className="field-label">Photos</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {draftImages.map((src, i) => <div key={i} className="h-20 rounded-lg overflow-hidden"><img src={src} className="w-full h-full object-cover" alt="" /></div>)}
            </div>
            <ImageUploader folder="rooms/new" multiple label="Upload from device" onUploaded={urls => setDraftImages([...draftImages, ...urls])} />
          </div>
        </div>
        <button onClick={submitAdd} className="btn-primary w-full justify-center mt-6">Add room type</button>
      </Modal>
    </div>
  )
}
