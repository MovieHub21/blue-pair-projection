'use client'

import { useState } from 'react'
import AnnexMenuExperience from '../../../components/annex/AnnexMenuExperience'
import type { MenuItem } from '../../../data/mock'

const OUTLETS = ['Blue Pair Restaurant', 'Outdoor Bar & Eatery'] as const

export default function DiningClient({ menuItems }: { menuItems: MenuItem[] }) {
  const [outlet, setOutlet] = useState<typeof OUTLETS[number]>('Blue Pair Restaurant')
  const items = menuItems.filter(item => item.outlet === outlet)

  const isRestaurant = outlet === 'Blue Pair Restaurant'

  return (
    <section>
      <div className="mx-auto max-w-7xl px-5 pt-10 md:px-10 md:pt-14">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {OUTLETS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setOutlet(option)}
              className={outlet === option
                ? 'shrink-0 rounded-full bg-[#d7b66a] px-5 py-2.5 text-[11px] font-bold text-[#08101d]'
                : 'shrink-0 rounded-full border border-[#111b2f]/10 bg-white px-5 py-2.5 text-[11px] font-semibold text-[#4c5668] transition hover:border-[#d7b66a] hover:text-[#111b2f]'}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <AnnexMenuExperience
        mode="food"
        eyebrow={isRestaurant ? 'Fine dining' : 'Casual & al fresco'}
        title={outlet}
        description={isRestaurant
          ? 'Explore Nigerian classics and continental favourites at Blue Pair Restaurant in Uromi, Edo State.'
          : 'Discover small chops, grilled favourites and cold drinks at the Outdoor Bar & Eatery in Uromi, Edo State.'}
        heroImage=""
        items={items}
        showAnnexNavigation={false}
        footerLabel="Blue Pair Hotel · Dining"
      />
    </section>
  )
}
