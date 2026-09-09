'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'

const explore = [
  { href: '/dining', label: 'Dining' },
  { href: '/vip-lounge', label: 'VIP Lounge' },
  { href: '/pool', label: 'Indoor Pool' },
  { href: '/gym', label: 'Gym' },
  { href: '/club', label: 'Club' },
  { href: '/games', label: 'Games' },
  { href: '/annex', label: 'The Annex' },
  { href: '/events', label: 'Events' },
]

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-black/5">
      <div className="container-w flex items-center justify-between py-4 px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold text-navy-950">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />Blue Pair Hotel
        </Link>
        <div className="hidden lg:flex items-center gap-8 text-[13.5px] font-medium text-navy-700">
          <Link href="/rooms" className="opacity-75 hover:opacity-100">Rooms</Link>
          <Link href="/about" className="opacity-75 hover:opacity-100">About</Link>
          <div className="relative" onMouseEnter={() => setExploreOpen(true)} onMouseLeave={() => setExploreOpen(false)}>
            <button className="flex items-center gap-1 opacity-75 hover:opacity-100">Explore <ChevronDown size={14} /></button>
            {exploreOpen && (
              <div className="absolute top-full left-0 pt-3 w-52">
                <div className="card p-2 grid gap-0.5">
                  {explore.map(e => <Link key={e.href} href={e.href} className="px-3 py-2 rounded-lg text-sm hover:bg-cream-100">{e.label}</Link>)}
                </div>
              </div>
            )}
          </div>
          <Link href="/offers" className="opacity-75 hover:opacity-100">Offers</Link>
          <Link href="/gallery" className="opacity-75 hover:opacity-100">Gallery</Link>
          <Link href="/contact" className="opacity-75 hover:opacity-100">Contact</Link>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/account/login" className="text-[13.5px] font-semibold text-navy-800">Sign in</Link>
          <Link href="/booking" className="btn-gold btn-sm">Book a room</Link>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="lg:hidden px-6 pb-6 flex flex-col gap-1 text-sm font-medium">
          <Link href="/rooms" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Rooms</Link>
          <Link href="/about" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">About</Link>
          {explore.map(e => <Link key={e.href} href={e.href} onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">{e.label}</Link>)}
          <Link href="/offers" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Offers</Link>
          <Link href="/gallery" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Gallery</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Contact</Link>
          <div className="flex gap-2 mt-4">
            <Link href="/account/login" onClick={() => setOpen(false)} className="btn-outline btn-sm flex-1 justify-center">Sign in</Link>
            <Link href="/booking" onClick={() => setOpen(false)} className="btn-gold btn-sm flex-1 justify-center">Book a room</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
