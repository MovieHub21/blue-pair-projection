import Link from 'next/link'
import { Users, BedDouble, Ruler } from 'lucide-react'
import { naira } from '../../lib/format'
import type { RoomType } from '../../data/mock'

export default function RoomCard({ room, availableCount, showRoomCount = false, showAvailabilityBadge = true }: { room: RoomType; availableCount?: number; showRoomCount?: boolean; showAvailabilityBadge?: boolean }) {
  const hasLiveCount = typeof availableCount === 'number'
  const count = hasLiveCount ? availableCount : 0
  const available = hasLiveCount ? count > 0 : true

  return (
    <div className="card group flex min-h-[620px] flex-col overflow-hidden rounded-md border border-navy-900/10 bg-white shadow-sm">
      <div className="relative h-64 shrink-0 overflow-hidden sm:h-72">
        <img loading="lazy" decoding="async" src={room.images[0]} alt={room.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {showAvailabilityBadge && <span className={'absolute left-4 top-4 ' + (available ? 'pill-green' : 'pill-red') + ' bg-white/95 shadow-sm'}>
          {available ? (showRoomCount ? `${count} rooms` : `${count} available`) : 'Fully booked'}
        </span>}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-display text-xl font-semibold leading-tight text-navy-950 sm:text-2xl">{room.name}</h3>
          <div className="shrink-0 text-right leading-none">
            <div className="font-display text-xl font-semibold text-gold-600 sm:text-2xl">{naira(room.price)}<span className="ml-1 font-body text-xs font-normal text-navy-400">/ night</span></div>
          </div>
        </div>

        <div className="my-5 h-px bg-navy-900/10" />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-navy-500 sm:text-sm">
          <span className="flex items-center gap-1.5"><Ruler size={14} className="text-navy-400" /> {room.sizeSqm} m²</span>
          <span className="flex items-center gap-1.5"><Users size={14} className="text-navy-400" /> {room.guests} guests</span>
          <span className="flex items-center gap-1.5"><BedDouble size={14} className="text-navy-400" /> {room.bedType}</span>
        </div>

        <div className="mt-4 text-xs leading-5 text-navy-400 sm:text-sm">
          {room.description}
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-navy-900/10 pt-6">
          <Link href={`/rooms/${room.slug}`} className="text-sm font-semibold text-navy-900 underline underline-offset-4 transition-colors hover:text-gold-600">View room details</Link>
          <Link href={`/booking?room=${room.slug}`} aria-disabled={!available} className={'btn-primary btn-sm ml-auto min-w-[118px] justify-center ' + (!available ? 'pointer-events-none opacity-50' : '')}>{available ? 'Book now' : 'Fully booked'}</Link>
        </div>
      </div>
    </div>
  )
}
