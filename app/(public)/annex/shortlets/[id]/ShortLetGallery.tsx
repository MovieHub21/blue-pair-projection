'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Images } from 'lucide-react'
import ImageCarousel from '../../../../../components/ui/ImageCarousel'

// An Airbnb-style photo grid: one lead photo, up to four smaller tiles, and a "Show all photos"
// button that opens the full gallery — a slow, hands-off cross-fade, the same feel as the room pages.
export default function ShortLetGallery({ images, name }: { images: string[]; name: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = previous }
  }, [open])

  if (images.length === 0) return null
  const tiles = images.slice(1, 5)

  return (
    <>
      <div className="relative grid grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-xl md:rounded-2xl" style={{ aspectRatio: '16 / 8' }}>
        <button type="button" onClick={() => setOpen(true)} className="group relative col-span-4 row-span-2 md:col-span-2">
          <img src={images[0]} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:brightness-95" />
        </button>
        {tiles.map((src, i) => (
          <button key={src + i} type="button" onClick={() => setOpen(true)} className={'group relative hidden md:block ' + (tiles.length <= 2 ? 'col-span-2 row-span-2' : '')}>
            <img src={src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:brightness-95" />
          </button>
        ))}
        {images.length > 1 && (
          <button type="button" onClick={() => setOpen(true)} className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy-950 shadow-md transition hover:-translate-y-0.5">
            <Images size={14} /> Show all {images.length} photos
          </button>
        )}
      </div>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-navy-950">
          <div className="flex items-center justify-between px-5 py-4 md:px-8">
            <span className="font-display text-lg text-white">{name}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close gallery" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={18} /></button>
          </div>
          <div className="flex-1 px-5 pb-6 md:px-8">
            <ImageCarousel images={images} alt={name} className="h-full w-full rounded-xl" autoPlay interval={5000} transition="fade" showArrows showDots showCounter />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
