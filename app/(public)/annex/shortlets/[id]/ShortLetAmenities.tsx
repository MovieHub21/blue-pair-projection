'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown } from 'lucide-react'

const COLLAPSED_COUNT = 8

// Same collapse pattern as the room pages: show the first eight, offer the rest on request, so a
// long amenity list doesn't push the booking card far down the page.
export default function ShortLetAmenities({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false)
  if (amenities.length === 0) return null
  const hasMore = amenities.length > COLLAPSED_COUNT
  const visible = expanded ? amenities : amenities.slice(0, COLLAPSED_COUNT)

  return (
    <div>
      <h3 className="font-display text-xl text-navy-950">What this place offers</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map(a => <div key={a} className="flex items-center gap-2.5 text-sm text-navy-700"><CheckCircle2 size={16} className="shrink-0 text-gold-500" />{a}</div>)}
      </div>
      {hasMore && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold text-navy-800 hover:border-gold-400">
          {expanded ? 'Show fewer amenities' : `Show all ${amenities.length} amenities`}
          <ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      )}
    </div>
  )
}
