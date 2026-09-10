'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import RoomCard from '../../../components/ui/RoomCard'
import type { RoomType } from '../../../data/mock'
import { ChevronDown } from 'lucide-react'

export default function RoomsClient({ roomTypes }: { roomTypes: RoomType[] }) {
  const params = useSearchParams()
  const [category, setCategory] = useState('All')
  const cats = ['All', ...Array.from(new Set(roomTypes.map(r => r.category)))]
  const filtered = category === 'All' ? roomTypes : roomTypes.filter(r => r.category === category)

  return (
    <div className="container-w px-6 md:px-10 py-8">
      {params.get('checkin') && (
        <div className="mb-6 text-sm bg-emerald-50 text-emerald-700 rounded-xl2 px-5 py-3.5 font-medium">
          Showing availability for {params.get('checkin')} → {params.get('checkout')}
        </div>
      )}
      <div className="flex flex-wrap gap-2.5 mb-10">
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={'px-4 py-2.5 rounded-full text-sm border ' + (category === c ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15 text-navy-700')}>
            {c}
          </button>
        ))}
        <button className="px-4 py-2.5 rounded-full text-sm border border-black/15 text-navy-700 flex items-center gap-1.5 ml-auto">Price <ChevronDown size={13} /></button>
        <button className="px-4 py-2.5 rounded-full text-sm border border-black/15 text-navy-700 flex items-center gap-1.5">Capacity <ChevronDown size={13} /></button>
        <button className="px-4 py-2.5 rounded-full text-sm border border-black/15 text-navy-700 flex items-center gap-1.5">Amenities <ChevronDown size={13} /></button>
      </div>
      <div className="grid md:grid-cols-3 gap-6 pb-20">
        {filtered.map(r => <RoomCard key={r.id} room={r} available={r.active} />)}
      </div>
    </div>
  )
}
