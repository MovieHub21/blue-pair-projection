'use client'
import { useStore } from '../../../store/useStore'
import ImageUploader from '../../../components/admin/ImageUploader'
import { Trash2 } from 'lucide-react'

export default function GalleryManagement() {
  const galleryImages = useStore(s => s.galleryImages)
  const addGalleryImage = useStore(s => s.addGalleryImage)
  const removeGalleryImage = useStore(s => s.removeGalleryImage)

  function handleUploaded(urls: string[]) {
    urls.forEach(u => addGalleryImage(u))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gallery Management</h1>
          <p className="text-xs text-navy-400 mt-1">Pick photos from your phone or computer — they appear live on the public Gallery and About pages.</p>
        </div>
        <ImageUploader folder="gallery" multiple label="Upload photos" onUploaded={handleUploaded} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {galleryImages.map(g => (
          <div key={g.id} className="relative h-40 rounded-xl2 overflow-hidden group">
            <img src={g.url} className="w-full h-full object-cover" alt={g.caption ?? ''} />
            <button onClick={() => { if (confirm('Remove this image?')) removeGalleryImage(g.id) }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
          </div>
        ))}
        <div className="h-40 rounded-xl2 border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-2 text-xs text-navy-400">
          <span>Add from device</span>
          <ImageUploader folder="gallery" multiple label="Choose photos" onUploaded={handleUploaded} />
        </div>
      </div>
      {galleryImages.length === 0 && <p className="text-sm text-navy-400 mt-4">No gallery images yet — upload one above.</p>}
    </div>
  )
}
