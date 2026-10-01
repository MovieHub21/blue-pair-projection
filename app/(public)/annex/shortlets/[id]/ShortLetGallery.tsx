'use client'

import ImageCarousel from '../../../../../components/ui/ImageCarousel'

export default function ShortLetGallery({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) return null

  return (
    <ImageCarousel
      images={images}
      alt={name}
      className="h-[360px] sm:h-[420px] md:h-[500px] rounded-[1.25rem] md:rounded-[1.5rem] border border-gold-500/15 bg-navy-950 shadow-pop"
      autoPlay
      interval={6000}
      transition="fade"
      showArrows={false}
      showDots={images.length > 1}
    />
  )
}
