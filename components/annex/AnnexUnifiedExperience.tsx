'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { naira } from '../../lib/format'
import { DISH_NOUNS, DRINK_NOUNS, MenuBrowser, MenuHero, MenuClosing, countLabel } from '../menu/MenuKit'

type Outlet = 'bar' | 'restaurant' | 'grilling' | 'outdoor_eatery'

type Item = {
  id: string
  name: string
  category: string
  price: number
  available: boolean
  image?: string
  outlet: Outlet
}

export type AnnexSection = {
  key: Outlet
  label: string
  eyebrow: string
  title: string
  description: string
  heroImage: string
  items: Item[]
}

type Booking = { id: string; type: 'room' | 'short_let'; label: string; reference: string }

const outletLabel: Record<Outlet, string> = {
  bar: 'Annex Bar',
  restaurant: 'Annex Restaurant',
  grilling: 'Annex Grilling',
  outdoor_eatery: 'Outdoor Eatery',
}

const locationOptions = [
  ['room', 'Room'],
  ['short_let', 'Short-let'],
  ['bar', 'Annex Bar'],
  ['outdoor_eatery', 'Outdoor Eatery'],
  ['vip_lounge', 'VIP Lounge'],
] as const

export default function AnnexUnifiedExperience({ sections, activeBookings = [] }: { sections: AnnexSection[]; activeBookings?: Booking[] }) {
  const [activeKey, setActiveKey] = useState<Outlet>(sections[0]?.key || 'restaurant')
  const [cart, setCart] = useState<(Item & { quantity: number })[]>([])
  const [showOrder, setShowOrder] = useState(false)
  const [location, setLocation] = useState<'room' | 'short_let' | 'bar' | 'outdoor_eatery' | 'vip_lounge' | ''>('')
  const [takeout, setTakeout] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [notes, setNotes] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState('')

  const active = sections.find(section => section.key === activeKey) || sections[0]
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const activeNouns = active?.key === 'bar' ? DRINK_NOUNS : DISH_NOUNS

  useEffect(() => {
    if (!showOrder) return
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = bodyOverflow }
  }, [showOrder])

  const addToOrder = (item: Item) => {
    if (!item.available) return
    setCart(current => {
      const existing = current.find(x => x.id === item.id && x.outlet === item.outlet)
      return existing
        ? current.map(x => x.id === item.id && x.outlet === item.outlet ? { ...x, quantity: Math.min(50, x.quantity + 1) } : x)
        : [...current, { ...item, quantity: 1 }]
    })
    setMessage('')
  }

  const updateQuantity = (id: string, outlet: Outlet, delta: number) =>
    setCart(current => current.map(x => x.id === id && x.outlet === outlet
      ? { ...x, quantity: Math.max(0, Math.min(50, x.quantity + delta)) }
      : x).filter(x => x.quantity > 0))

  const cartItem = (id: string, outlet: Outlet) => cart.find(x => x.id === id && x.outlet === outlet)

  const submitOrder = async () => {
    if (!cart.length) return
    if (!takeout && !location) return setMessage('Choose where you want your order served.')
    if (takeout && (!contactEmail.trim() || !contactPhone.trim() || !deliveryAddress.trim())) return setMessage('Enter your email, phone number and delivery address.')
    if ((location === 'room' || location === 'short_let') && !bookingId) return setMessage('Select the current booking for that delivery location.')

    setPlacing(true)
    setMessage('')
    try {
      const response = await fetch('/api/bar/orders/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, outlet: item.outlet })),
          outlet: 'multi',
          location,
          bookingId: bookingId || null,
          takeout,
          notes,
          contactEmail,
          contactPhone,
          deliveryAddress,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || 'Unable to start payment.')
      window.location.href = result.authorizationUrl
    } catch (error: any) {
      setMessage(error?.message || 'Unable to start payment.')
      setPlacing(false)
    }
  }

  const visibleItems = useMemo(() => active?.items || [], [active])

  if (!active) return null

  return (
    <div className="bg-cream-50 text-navy-900">
      <MenuHero
        eyebrow={active.eyebrow}
        kicker="The Annex · Blue Pair"
        title={active.title}
        description={active.description}
        image={active.heroImage}
        meta={countLabel(active.items.length, activeNouns)}
      />

      <section id="annex-sections" className="sticky top-0 z-40 border-b border-navy-900/10 bg-cream-50/95 px-3 py-2 shadow-sm backdrop-blur-xl md:px-5 md:py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button type="button" aria-label="Scroll sections left" onClick={() => document.getElementById('annex-section-tabs')?.scrollBy({ left: -220, behavior: 'smooth' })} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-900/10 bg-white md:flex">
            <ChevronLeft size={15} />
          </button>
          <div id="annex-section-tabs" role="tablist" aria-label="Annex dining sections" className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map(section => (
              <button
                key={section.key}
                type="button"
                role="tab"
                aria-selected={activeKey === section.key}
                onClick={() => setActiveKey(section.key)}
                className={activeKey === section.key
                  ? 'shrink-0 snap-start rounded-full border border-navy-950 bg-navy-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-sm md:px-5'
                  : 'shrink-0 snap-start rounded-full border border-navy-900/10 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-navy-700 transition hover:border-gold-500/50 hover:text-navy-950 md:px-5'}
              >
                {section.label}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Scroll sections right" onClick={() => document.getElementById('annex-section-tabs')?.scrollBy({ left: 220, behavior: 'smooth' })} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-900/10 bg-white md:flex">
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      <div key={active.key} className="transition-opacity duration-300">
        <MenuBrowser
          items={visibleItems}
          nouns={activeNouns}
          label={active.label}
          renderAction={(item) => {
            const inCart = cartItem(item.id, item.outlet)
            return inCart ? (
              <div className="flex items-center gap-1 rounded-full border border-gold-500/50 bg-gold-400/15 p-0.5">
                <button type="button" aria-label={'Remove one ' + item.name} onClick={() => updateQuantity(item.id, item.outlet, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/15 bg-white text-sm">−</button>
                <span className="w-5 text-center text-xs font-semibold">{inCart.quantity}</span>
                <button type="button" aria-label={'Add one more ' + item.name} onClick={() => addToOrder(item)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold">+</button>
              </div>
            ) : (
              <button type="button" disabled={!item.available} onClick={() => addToOrder(item)} className="rounded-full bg-navy-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-35">
                {item.available ? 'Add' : 'Unavailable'}
              </button>
            )
          }}
          note="Choose from any Annex section and add everything to one order. Your cart stays with you as you switch sections."
        />
      </div>

      <MenuClosing
        eyebrow="Blue Pair Hotel · The Annex"
        title="Good food. Good drinks. One easy order."
        description="Move between the restaurant, grill, outdoor eatery and bar without losing your cart."
        actions={[{ label: 'Book a room', href: '/rooms', primary: true }, { label: 'Dining at Blue Pair', href: '/dining' }]}
        links={[
          { label: 'Restaurant', href: '/annex/restaurant' },
          { label: 'Grilling', href: '/annex/grilling' },
          { label: 'Outdoor Eatery', href: '/annex/outdoor-eatery' },
          { label: 'Annex Bar', href: '/annex/bar' },
          { label: 'Short-lets', href: '/annex/shortlets' },
        ]}
        bottomInset
      />

      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-[#060B17]/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl md:px-4 md:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-[.2em] text-white/35">Your Annex order</p>
            <p className="truncate font-display text-base text-white md:text-lg">{cartCount} {cartCount === 1 ? 'item' : 'items'} · {naira(cartTotal)}</p>
          </div>
          <button type="button" onClick={() => setShowOrder(true)} disabled={!cart.length} className="shrink-0 rounded-full bg-[#d7b66a] px-5 py-2.5 text-[11px] font-bold text-[#08101d] shadow-lg disabled:cursor-not-allowed disabled:opacity-35">
            Checkout
          </button>
        </div>
      </div>

      {showOrder && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-center overflow-hidden bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6">
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto bg-[#0A1229] px-4 py-5 text-white shadow-2xl md:rounded-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><span className="text-[10px] uppercase tracking-[.25em] text-[#d7b66a]">The Annex</span><h2 className="mt-1 font-display text-3xl md:text-4xl">Your order</h2></div>
              <button type="button" onClick={() => setShowOrder(false)} className="text-xs text-white/50">Close</button>
            </div>

            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {cart.map(item => (
                <div key={item.outlet + ':' + item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="font-display text-lg">{item.name}</p><p className="text-[10px] uppercase tracking-[.14em] text-[#d7b66a]/70">{outletLabel[item.outlet]}</p><p className="mt-0.5 text-xs text-white/40">{naira(item.price)} each</p></div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(item.id, item.outlet, -1)} className="h-7 w-7 rounded-full border border-white/15">−</button>
                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.outlet, 1)} className="h-7 w-7 rounded-full border border-white/15">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7b66a]">Where should we serve it? <span className="text-red-400">*</span></p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {locationOptions.map(([value, label]) => (
                  <button key={value} type="button" disabled={takeout} onClick={() => { setLocation(value); if (value !== 'room' && value !== 'short_let') setBookingId('') }} className={location === value ? 'rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3 text-left' : 'rounded-xl border border-white/10 bg-white/[.03] p-3 text-left disabled:opacity-40'}>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-white/35">{value === 'room' || value === 'short_let' ? 'Choose your active booking below' : 'Available during your stay'}</span>
                  </button>
                ))}
              </div>

              <label className={takeout ? 'mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3' : 'mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3'}>
                <input type="checkbox" checked={takeout} onChange={e => { const checked = e.target.checked; setTakeout(checked); if (checked) { setLocation(''); setBookingId('') } }} className="h-4 w-4 accent-[#d7b66a]" />
                <span><span className="block text-sm font-semibold">Order as takeaway</span><span className="mt-0.5 block text-xs text-white/35">We will arrange delivery to the address you provide.</span></span>
              </label>

              {(location === 'room' || location === 'short_let') && (
                <div className="mt-3 space-y-2">
                  {activeBookings.filter(b => b.type === location).map(b => (
                    <button type="button" key={b.id} onClick={() => setBookingId(b.id)} className={bookingId === b.id ? 'w-full rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3 text-left' : 'w-full rounded-xl border border-white/10 p-3 text-left'}>
                      <span className="block font-semibold">{b.label}</span><span className="text-[10px] uppercase tracking-[.14em] text-white/35">{b.reference} · Current stay</span>
                    </button>
                  ))}
                  {!activeBookings.some(b => b.type === location) && <p className="rounded-xl border border-white/10 p-3 text-xs text-white/40">No active booking available for delivery.</p>}
                </div>
              )}

              {takeout && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email address *" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm outline-none placeholder:text-white/25" />
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number *" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm outline-none placeholder:text-white/25" />
                  </div>
                  <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} placeholder="Delivery address *" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm outline-none placeholder:text-white/25" />
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Special instructions (optional)" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm outline-none placeholder:text-white/25" />
                </>
              )}
            </div>

            {message && <p className="mt-3 rounded-xl border border-[#d7b66a]/20 bg-[#d7b66a]/5 p-3 text-sm text-[#e3c77d]">{message}</p>}

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
              <div><span className="text-xs text-white/40">Total</span><p className="font-display text-xl">{naira(cartTotal)}</p></div>
              <button type="button" disabled={!cart.length || placing || (!takeout && !location) || (takeout && (!contactEmail.trim() || !contactPhone.trim() || !deliveryAddress.trim())) || ((location === 'room' || location === 'short_let') && !activeBookings.some(b => b.id === bookingId))} onClick={() => void submitOrder()} className="rounded-full bg-[#d7b66a] px-5 py-2.5 text-xs font-bold text-[#08101d] disabled:cursor-not-allowed disabled:opacity-40">
                {placing ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
