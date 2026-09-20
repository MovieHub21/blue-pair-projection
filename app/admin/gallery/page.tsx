'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { mapGalleryImage, type GalleryImage } from '../../../lib/mappers'
import { pushToast } from '../../../components/ui/Toast'
import ImageUploader from '../../../components/admin/ImageUploader'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import { Trash2 } from 'lucide-react'

export default function GalleryManagement() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null)

  const loadImages = useCallback(async () => {
    const { data, error } = await supabase.from('gallery_images').select('*').order('sort_order')
    if (!error && data) setGalleryImages(data.map(mapGalleryImage))
  }, [])

  useEffect(() => {
    loadImages()
    const handleDbChange = (e: CustomEvent<{ table?: string }>) => {
      if (!e.detail?.table || e.detail.table === 'gallery_images') loadImages()
    }
    window.addEventListener('bluepair:database-change', handleDbChange as EventListener)
    return () => window.removeEventListener('bluepair:database-change', handleDbChange as EventListener)
  }, [loadImages])

  async function addGalleryImage(url: string) {
    const id = `gi_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const sortOrder = galleryImages.length
    const newImg: GalleryImage = { id, url, sortOrder }
    setGalleryImages(prev => [...prev, newImg])
    const { error } = await supabase.from('gallery_images').insert({ id, url, caption: null, sort_order: sortOrder })
    if (error) {
      pushToast('Failed to save image: ' + error.message, 'error')
      loadImages()
    }
  }

  async function removeGalleryImage(id: string) {
    setGalleryImages(prev => prev.filter(x => x.id !== id))
    const { error } = await supabase.from('gallery_images').delete().eq('id', id)
    if (error) {
      pushToast('Failed to remove image: ' + error.message, 'error')
      loadImages()
    } else {
      pushToast('Image removed', 'success')
    }
  }

  function handleUploaded(urls: string[]) { urls.forEach(u => addGalleryImage(u)) }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3"><div><h1 className="text-2xl font-semibold">Gallery Management</h1><p className="text-xs text-navy-400 mt-1">Pick photos from your phone or computer — they appear live on the public Gallery and About pages.</p></div><ImageUploader folder="gallery" multiple label="Upload photos" onUploaded={handleUploaded} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {galleryImages.map(g => <div key={g.id} className="relative h-40 rounded-xl2 overflow-hidden group"><img loading="lazy" decoding="async" src={g.url} className="w-full h-full object-cover" alt={g.caption ?? ''} /><button onClick={() => setDeleteTarget({ id: g.id, url: g.url })} aria-label="Delete gallery image" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"><Trash2 size={13} /></button></div>)}
        <div className="h-40 rounded-xl2 border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-2 text-xs text-navy-400"><span>Add from device</span><ImageUploader folder="gallery" multiple label="Choose photos" onUploaded={handleUploaded} /></div>
      </div>
      {galleryImages.length === 0 && <p className="text-sm text-navy-400 mt-4">No gallery images yet — upload one above.</p>}
      <DeleteConfirmDialog open={!!deleteTarget} itemName="Gallery image" description="This photo will be permanently removed from the Blue Pair gallery." onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) removeGalleryImage(deleteTarget.id) }} />
    </div>
  )
}
