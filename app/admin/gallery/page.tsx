'use client'
import { useState } from 'react'
import { galleryImages } from '../../../data/mock'
import { useStore } from '../../../store/useStore'
import { Plus, Trash2 } from 'lucide-react'

export default function GalleryManagement() {
  const [images, setImages] = useState(galleryImages)
  const { pushToast } = useStore()

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Gallery Management</h1>
        <button onClick={() => pushToast('Image uploaded', 'success')} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Upload image</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((g,i) => (
          <div key={i} className="relative h-40 rounded-xl2 overflow-hidden group">
            <img src={g} className="w-full h-full object-cover" />
            <button onClick={() => setImages(images.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13}/></button>
          </div>
        ))}
        <button onClick={() => pushToast('Image uploaded', 'success')} className="h-40 rounded-xl2 border-2 border-dashed border-black/15 flex items-center justify-center text-navy-400 text-xs font-semibold">+ Upload new</button>
      </div>
    </div>
  )
}
