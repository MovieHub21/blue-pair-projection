'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { MenuItem } from '../../../data/mock'
import { MenuBrowser, MenuClosing, MenuHero, countLabel, heroGhostButton } from '../../../components/menu/MenuKit'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80'

const VENUES = [
  { outlet: 'Blue Pair Restaurant', tag: 'Fine dining', blurb: 'Nigerian classics and continental favourites.' },
  { outlet: 'Outdoor Bar & Eatery', tag: 'Casual & al fresco', blurb: 'Small chops, grilled favourites and cold drinks.' },
] as const

type Outlet = typeof VENUES[number]['outlet']

export default function DiningClient({ menuItems }: { menuItems: MenuItem[] }) {
  const [outlet, setOutlet] = useState<Outlet>('Blue Pair Restaurant')

  const venueItems = useMemo(() => Object.fromEntries(VENUES.map(v => [v.outlet, menuItems.filter(item => item.outlet === v.outlet)])) as Record<Outlet, MenuItem[]>, [menuItems])
  const items = venueItems[outlet]

  return (
    <div className="bg-cream-50 text-navy-900">
      <MenuHero
        eyebrow="Food & drink"
        kicker="Uromi, Edo State"
        title="Dining at Blue Pair"
        description="Nigerian classics and continental favourites at the restaurant, and small chops, grills and cold drinks at the Outdoor Bar & Eatery."
        image={HERO_IMAGE}
        overlap
        actions={<Link href="/contact" className={heroGhostButton}>Contact us</Link>}
      />

      {/* Where would you like to dine? Overlaps the hero. */}
      <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-5 md:-mt-32 md:px-10">
        <div className="grid gap-3 md:grid-cols-2 md:gap-5" role="group" aria-label="Choose where you would like to dine">
          {VENUES.map(option => {
            const active = option.outlet === outlet
            return (
              <button
                key={option.outlet}
                type="button"
                aria-pressed={active}
                onClick={() => setOutlet(option.outlet)}
                className={'group relative overflow-hidden rounded-xl border p-6 text-left transition duration-300 md:p-7 ' + (active
                  ? 'border-gold-400 bg-navy-800 text-white shadow-[0_24px_60px_-24px_rgba(6,11,23,.7)]'
                  : 'border-navy-900/10 bg-white text-navy-900 shadow-[0_18px_40px_-26px_rgba(6,11,23,.35)] hover:-translate-y-0.5 hover:border-gold-400')}
              >
                <span className={'absolute inset-x-0 top-0 h-[3px] transition ' + (active ? 'bg-gold-400' : 'bg-transparent group-hover:bg-gold-400/60')} />
                <span className={'text-[10px] font-semibold uppercase tracking-[.24em] ' + (active ? 'text-gold-400' : 'text-gold-600')}>{option.tag}</span>
                <span className="mt-2 block font-display text-2xl leading-tight md:text-3xl">{option.outlet}</span>
                <span className={'mt-2 block max-w-sm text-sm leading-6 ' + (active ? 'text-white/70' : 'text-navy-900/60')}>{option.blurb}</span>
                <span className={'mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] ' + (active ? 'text-white/90' : 'text-navy-900/70')}>
                  {countLabel(venueItems[option.outlet].length)}
                  <span className={'h-px w-8 ' + (active ? 'bg-gold-400' : 'bg-navy-900/25')} />
                  {active ? 'Viewing' : 'View menu'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Keyed by venue, so the course filter and search start fresh when the venue changes. */}
      <MenuBrowser key={outlet} items={items} label={outlet} note="Prices are in Nigerian naira. Dishes marked unavailable are off the menu for now." />

      <MenuClosing
        title="Dine with us, stay with us."
        description="Book a room and the restaurant is right here. Or head to The Annex for grills, drinks and nightlife."
        actions={[{ label: 'Book a room', href: '/rooms', primary: true }, { label: 'Explore The Annex', href: '/annex' }]}
      />
    </div>
  )
}
