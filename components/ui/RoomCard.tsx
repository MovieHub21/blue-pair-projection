import Link from 'next/link'
import { Users, BedDouble, Ruler } from 'lucide-react'
import { naira } from '../../lib/format'
import type { RoomType } from '../../data/mock'

export default function RoomCard({ room, availableCount }: { room: RoomType; availableCount?: number }) {
  const hasLiveCount = typeof availableCount === 'number'
  const count = hasLiveCount ? availableCount : 0
  const available = hasLiveCount ? count > 0 : true

  return (
    <div className="card overflow-hidden flex flex-col group">
      <div className="relative h-56 overflow-hidden">
        <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className={'absolute top-3.5 left-3.5 ' + (available ? 'pill-green' : 'pill-red') + ' bg-white/95'}>
          {available ? `${count} available` : 'Sold out'}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-navy-950">{room.name}</h3>
          <div className="text-right shrink-0">
            <div className="font-display text-lg text-navy-950">{naira(room.price)}</div>
            <div className="text-[11px] text-navy-400">per night</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-navy-500 flex-wrap">
          <span className="flex items-center gap-1"><Users size={13} /> {room.guests} guests</span>
          <span className="flex items-center gap-1"><BedDouble size={13} /> {room.bedType}</span>
          <span className="flex items-center gap-1"><Ruler size={13} /> {room.sizeSqm} m²</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {room.amenities.slice(0, 3).map(a => <span key={a} className="tag">{a}</span>)}
        </div>
        <div className="flex gap-2 mt-auto pt-2">
          <Link href={`/rooms/${room.slug}`} className="btn-outline btn-sm flex-1 justify-center">View room</Link>
          <Link href={`/booking?room=${room.slug}`} aria-disabled={!available} className={'btn-primary btn-sm flex-1 justify-center ' + (!available ? 'pointer-events-none opacity-50' : '')}>{available ? 'Book now' : 'Sold out'}</Link>
        </div>
      </div>
    </div>
  )
}
