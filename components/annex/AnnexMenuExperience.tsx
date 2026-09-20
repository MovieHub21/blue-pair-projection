'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ChevronRight } from 'lucide-react'
import { naira } from '../../lib/format'

export type AnnexMenuItem = {
  id: string
  name: string
  category: string
  price: number
  available: boolean
  image?: string
}

type Props = {
  title: string
  eyebrow: string
  description: string
  heroImage: string
  items: AnnexMenuItem[]
  mode: 'bar' | 'food'
  showAnnexNavigation?: boolean
  footerLabel?: string
  activeBookings?: { id: string; type: 'room' | 'short_let'; label: string; reference: string }[]
}

export default function AnnexMenuExperience({ title, eyebrow, description, heroImage, items, mode, showAnnexNavigation = true, footerLabel = 'Blue Pair Hotel · The Annex', activeBookings = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([])
  const [showOrder, setShowOrder] = useState(false)
  const [location, setLocation] = useState<'room' | 'short_let' | 'bar' | 'outdoor_eatery' | 'vip_lounge' | ''>('')
  const [bookingId, setBookingId] = useState('')
  const [notes, setNotes] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const isBar = mode === 'bar'

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map(x => x.category).filter(Boolean)))],
    [items],
  )

  const filtered = useMemo(
    () => activeCategory === 'All' ? items : items.filter(x => x.category === activeCategory),
    [activeCategory, items],
  )

  const featured = items.filter(x => x.image).slice(0, 3)
  const lead = featured[0] || items[0]
  const supporting = featured.slice(1, 3)
  const menuWithoutLead = lead ? filtered.filter(x => x.id !== lead.id) : filtered
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const addToOrder = (item: AnnexMenuItem) => {
    if (!item.available) return
    setCart(current => {
      const existing = current.find(x => x.id === item.id)
      return existing ? current.map(x => x.id === item.id ? { ...x, quantity: Math.min(50, x.quantity + 1) } : x) : [...current, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
    setOrderMessage('')
  }
  const updateQuantity = (id: string, delta: number) => setCart(current => current.map(x => x.id === id ? { ...x, quantity: Math.max(0, Math.min(50, x.quantity + delta)) } : x).filter(x => x.quantity > 0))
  const cartItem = (id: string) => cart.find(x => x.id === id)
  const submitOrder = async () => {
    if (!cart.length) return
    if (!location) return setOrderMessage('Choose where you want your order served.')
    if ((location === 'room' || location === 'short_let') && !bookingId) return setOrderMessage('Select the current booking for that delivery location.')
    setPlacing(true); setOrderMessage('')
    try {
      const response = await fetch('/api/bar/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.map(x => ({ id: x.id, quantity: x.quantity })), location, bookingId: bookingId || null, notes, contactEmail, contactPhone, deliveryAddress }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || 'Unable to place your order.')
      setCart([]); setNotes(''); setContactEmail(''); setContactPhone(''); setDeliveryAddress(''); setBookingId(''); setLocation(''); setOrderMessage(`Order ${result.reference} received. ${result.deliveryLabel} will receive it.`)
    } catch (error: any) {
      setOrderMessage(error?.message || 'Unable to place your order.')
    } finally { setPlacing(false) }
  }

  return (
    <div className={isBar ? 'min-h-screen bg-[#05080e] text-white' : 'min-h-screen bg-[#f7f3ec] text-[#111b2f]'}>
      <section className="relative min-h-[690px] overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : lead?.image ? (
          <img src={lead.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className={isBar
          ? 'absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,13,.96)_0%,rgba(3,7,13,.72)_42%,rgba(3,7,13,.25)_100%)]'
          : 'absolute inset-0 bg-[linear-gradient(90deg,rgba(5,18,39,.92)_0%,rgba(5,18,39,.66)_45%,rgba(5,18,39,.2)_100%)]'} />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,7,13,.96),transparent_48%)]" />

        <div className="relative z-10 mx-auto flex min-h-[690px] max-w-7xl items-end px-5 pb-16 md:px-10 md:pb-20">
          <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b66a]">{eyebrow}</span>
                <span className="h-px w-12 bg-[#d7b66a]/70" />
                <span className="hidden text-[10px] uppercase tracking-[.2em] text-white/45 sm:block">The Annex · Blue Pair</span>
              </div>
              <h1 className="font-display text-6xl font-semibold leading-[.86] tracking-[-.055em] text-white md:text-8xl">{title}</h1>
              <p className="mt-7 max-w-xl text-sm leading-7 text-white md:text-base">{description}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#menu" className="inline-flex items-center gap-2 rounded-full bg-[#d7b66a] px-6 py-3 text-xs font-bold text-[#08101d] transition hover:-translate-y-0.5 hover:bg-[#e5c87d]">
                  Explore the menu <ArrowDown size={15} />
                </a>
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/65 backdrop-blur-md">
                  {items.length} {isBar ? 'drinks' : 'dishes'}
                </span>
              </div>
            </div>

            {lead && (
              <div className="hidden justify-end lg:flex">
                <div className="w-full max-w-[390px] rotate-1 overflow-hidden border border-white/15 bg-black/30 p-3 shadow-2xl backdrop-blur-sm">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {lead.image ? <img src={lead.image} alt={lead.name} className="h-full w-full object-cover transition duration-700 hover:scale-105" /> : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-6 pt-20">
                      <span className="text-[9px] uppercase tracking-[.2em] text-[#e0c57c]">{lead.category || 'Featured'}</span>
                      <div className="mt-1 flex items-end justify-between gap-4">
                        <h2 className="font-display text-3xl text-white">{lead.name}</h2>
                        <span className="font-display text-sm text-white/80">{naira(lead.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {supporting.length > 0 && (
        <section className={isBar ? 'border-y border-white/10 bg-[#0a1019]' : 'border-y border-[#111b2f]/10 bg-white'}>
          <div className="mx-auto grid max-w-7xl md:grid-cols-2">
            {supporting.map((item, index) => (
              <div key={item.id} className="group relative min-h-[230px] overflow-hidden border-b border-white/10 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                {item.image && <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                <div className={isBar
                  ? 'absolute inset-0 bg-gradient-to-r from-[#05080e] via-[#05080e]/55 to-transparent'
                  : 'absolute inset-0 bg-gradient-to-r from-[#07152d]/90 via-[#07152d]/55 to-transparent'} />
                <div className="relative z-10 flex min-h-[230px] max-w-md flex-col justify-end p-8">
                  <span className="text-[9px] uppercase tracking-[.2em] text-[#d7b66a]">{item.category || 'Featured'}</span>
                  <h2 className="mt-2 font-display text-3xl text-white">{item.name}</h2>
                  <span className="mt-2 font-display text-sm text-white/65">{naira(item.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="menu" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className={isBar ? 'text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b66a]' : 'text-[10px] font-semibold uppercase tracking-[.28em] text-[#9d7428]'}>{isBar ? 'The drink list' : 'The kitchen selection'}</span>
            <h2 className="mt-3 font-display text-5xl leading-none tracking-[-.04em] md:text-6xl">{isBar ? 'What are you having tonight?' : 'Choose your craving.'}</h2>
            <p className={isBar ? 'mt-5 max-w-xl text-sm leading-7 text-white/48' : 'mt-5 max-w-xl text-sm leading-7 text-[#5d6676]'}>A curated selection from the Annex. Take your time there is something worth discovering.</p>
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)}
                className={activeCategory === category
                  ? 'shrink-0 rounded-full bg-[#d7b66a] px-5 py-2.5 text-[11px] font-bold text-[#08101d] shadow-lg shadow-[#d7b66a]/10'
                  : isBar
                    ? 'shrink-0 rounded-full border border-white/10 bg-white/[.04] px-5 py-2.5 text-[11px] font-semibold text-white/55 transition hover:border-white/20 hover:text-white'
                    : 'shrink-0 rounded-full border border-[#111b2f]/10 bg-white px-5 py-2.5 text-[11px] font-semibold text-[#4c5668] transition hover:border-[#d7b66a] hover:text-[#111b2f]'}>
                {category}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-16">
            {lead && activeCategory === 'All' && (
              <article className={isBar ? 'grid overflow-hidden border border-white/10 bg-[#0a1019] lg:grid-cols-[1.2fr_.8fr]' : 'grid overflow-hidden border border-[#111b2f]/10 bg-white lg:grid-cols-[1.2fr_.8fr]'}>
                <div className="relative min-h-[390px] overflow-hidden">
                  {lead.image ? <img src={lead.image} alt={lead.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                  <span className="absolute left-7 top-7 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-[9px] uppercase tracking-[.2em] text-white backdrop-blur-md">Signature selection</span>
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="text-[9px] uppercase tracking-[.2em] text-[#d7b66a]">{lead.category || 'Featured'}</span>
                  <h3 className="mt-3 font-display text-4xl leading-none md:text-5xl">{lead.name}</h3>
                  <p className={isBar ? 'mt-5 text-sm leading-7 text-white/48' : 'mt-5 text-sm leading-7 text-[#697282]'}>{isBar ? 'A signature choice from the Annex selection.' : 'One of the selections that defines the Annex table.'}</p>
                  <div className="mt-8 flex items-center justify-between border-t border-current/10 pt-5">
                    <span className="font-display text-xl text-[#c39a45]">{naira(lead.price)}</span>
                    {lead.available ? (cartItem(lead.id) ? <div className="flex items-center gap-2 rounded-full border border-[#d7b66a]/40 bg-[#d7b66a]/10 p-1"><button type="button" onClick={() => updateQuantity(lead.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-base">−</button><span className="w-5 text-center text-sm">{cartItem(lead.id)?.quantity}</span><button type="button" onClick={() => addToOrder(lead)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7b66a] text-base font-semibold text-[#08101d]">+</button></div> : <button type="button" onClick={() => addToOrder(lead)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7b66a] text-xl font-semibold text-[#08101d]">+</button>) : <span className="text-[10px] uppercase tracking-[.16em] text-red-500">Unavailable</span>}
                  </div>
                </div>
              </article>
            )}

            <div className={isBar ? 'overflow-hidden border-y border-white/10' : 'overflow-hidden border-y border-[#111b2f]/10'}>
              {menuWithoutLead.map((item, index) => (
                <article key={item.id} className={isBar
                  ? 'group grid grid-cols-[72px_1fr_auto] items-center gap-5 border-b border-white/10 py-5 last:border-b-0 md:grid-cols-[110px_1fr_auto_30px] md:gap-7'
                  : 'group grid grid-cols-[82px_1fr_auto] items-center gap-5 border-b border-[#111b2f]/10 py-5 last:border-b-0 md:grid-cols-[130px_1fr_auto_30px] md:gap-8'}>
                  <div className="relative aspect-square overflow-hidden bg-black/10">
                    {item.image ? <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" /> : <div className={isBar ? 'h-full w-full bg-[#111a28]' : 'h-full w-full bg-[#ece5da]'} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl md:text-2xl">{item.name}</h3>
                      {!item.available && <span className="text-[9px] uppercase tracking-[.15em] text-red-500">Unavailable</span>}
                    </div>
                    <p className={isBar ? 'mt-1 text-[10px] uppercase tracking-[.15em] text-white/30' : 'mt-1 text-[10px] uppercase tracking-[.15em] text-[#8a919d]'}>{item.category || 'House selection'}</p>
                  </div>
                  <span className="whitespace-nowrap font-display text-base text-[#c39a45]">{naira(item.price)}</span>
                  <div className="flex justify-end">{item.available ? (cartItem(item.id) ? <div className="flex items-center gap-1 rounded-full border border-[#d7b66a]/40 bg-[#d7b66a]/10 p-1"><button type="button" onClick={() => updateQuantity(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-sm">−</button><span className="w-5 text-center text-xs">{cartItem(item.id)?.quantity}</span><button type="button" onClick={() => addToOrder(item)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7b66a] text-sm font-semibold text-[#08101d]">+</button></div> : <button type="button" onClick={() => addToOrder(item)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7b66a] text-lg font-semibold text-[#08101d]">+</button>) : <span className="rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[.1em] text-white/25">Unavailable</span>}</div>
                </article>
              ))}
            </div>

            {supporting.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {supporting.map(item => (
                  <div key={item.id} className="group relative min-h-[300px] overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-7">
                      <span className="text-[9px] uppercase tracking-[.2em] text-[#d7b66a]">{item.category || 'Featured'}</span>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <h3 className="font-display text-3xl text-white">{item.name}</h3>
                        <span className="font-display text-sm text-white/75">{naira(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={isBar ? 'border-y border-white/10 py-20 text-center text-sm text-white/40' : 'border-y border-[#111b2f]/10 py-20 text-center text-sm text-[#70798a]'}>Nothing in this category yet. Check another category.</div>
        )}
      {isBar && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05080e]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[.2em] text-white/35">Your order</p>
                <p className="truncate font-display text-lg text-white">{cartCount} {cartCount === 1 ? 'item' : 'items'} · {naira(cartTotal)}</p>
              </div>
              <button type="button" onClick={() => setShowOrder(true)} disabled={!cart.length} className="shrink-0 rounded-full bg-[#d7b66a] px-6 py-3 text-xs font-bold text-[#08101d] shadow-lg disabled:cursor-not-allowed disabled:opacity-35">
                Checkout
              </button>
            </div>
          </div>
          {showOrder && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6">
              <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-[#0a1019] p-6 text-white shadow-2xl md:rounded-2xl md:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div><span className="text-[10px] uppercase tracking-[.25em] text-[#d7b66a]">Annex Bar</span><h2 className="mt-2 font-display text-4xl">Your order</h2></div>
                  <button type="button" onClick={() => setShowOrder(false)} className="text-sm text-white/50">Close</button>
                </div>
                <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
                  {cart.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-display text-xl">{item.name}</p><p className="mt-1 text-xs text-white/40">{naira(item.price)} each</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-full border border-white/15">−</button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-full border border-white/15">+</button></div></div>)}
                  {!cart.length && <p className="py-8 text-sm text-white/40">Your order is empty.</p>}
                </div>
                <div className="mt-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7b66a]">Where should we serve it? <span className="text-red-400">*</span></p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      ['room','Room'], ['short_let','Short-let'], ['bar','Annex Bar'], ['outdoor_eatery','Outdoor Eatery'], ['vip_lounge','VIP Lounge'],
                    ].map(([value,label]) => <button key={value} type="button" onClick={() => { setLocation(value as any); if (value !== 'room' && value !== 'short_let') setBookingId('') }} className={location === value ? 'rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-4 text-left' : 'rounded-xl border border-white/10 bg-white/[.03] p-4 text-left'}><span className="block text-sm font-semibold">{label}</span>{(value === 'room' || value === 'short_let') ? <span className="mt-1 block text-xs text-white/35">{activeBookings.filter(b => b.type === value).length ? 'Choose your active booking below' : 'No active booking'}</span> : <span className="mt-1 block text-xs text-white/35">{activeBookings.length ? 'Available during your stay' : 'Venue service'}</span>}</button>)}
                  </div>
                  {(location === 'room' || location === 'short_let') && <div className="mt-3 space-y-2">{activeBookings.filter(b => b.type === location).map(b => <button type="button" key={b.id} onClick={() => setBookingId(b.id)} className={bookingId === b.id ? 'w-full rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-4 text-left' : 'w-full rounded-xl border border-white/10 p-4 text-left'}><span className="block font-semibold">{b.label}</span><span className="mt-1 block text-[10px] uppercase tracking-[.14em] text-white/35">{b.reference} · Current stay</span></button>)}{!activeBookings.some(b => b.type === location) && <p className="rounded-xl border border-white/10 p-4 text-xs text-white/40">You do not have an active {location === 'room' ? 'room' : 'short-let'} booking available for delivery.</p>}</div>}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                  </div>
                  <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Delivery location / address" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special instructions (optional)" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                </div>
                {orderMessage && <p className="mt-4 rounded-xl border border-[#d7b66a]/20 bg-[#d7b66a]/5 p-3 text-sm text-[#e3c77d]">{orderMessage}</p>}
                <div className="mt-7 flex items-center justify-between gap-5 border-t border-white/10 pt-5"><div><span className="text-xs text-white/40">Total</span><p className="font-display text-2xl">{naira(cartTotal)}</p></div><button type="button" disabled={!cart.length || placing || !location || ((location === 'room' || location === 'short_let') && !activeBookings.some(b => b.id === bookingId))} onClick={() => void submitOrder()} className="rounded-full bg-[#d7b66a] px-6 py-3 text-xs font-bold text-[#08101d] disabled:cursor-not-allowed disabled:opacity-40">{placing ? 'Placing order…' : 'Place order'}</button></div>
              </div>
            </div>
          )}
        </>
      )}

      </section>

      <section className={isBar ? 'relative overflow-hidden border-t border-white/10 bg-[#03060a] px-5 py-24 text-center' : 'relative overflow-hidden border-t border-[#111b2f]/10 bg-[#ece4d8] px-5 py-24 text-center'}>
        <div className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-[#d7b66a]" />
        <p className={isBar ? 'text-[9px] uppercase tracking-[.3em] text-white/35' : 'text-[9px] uppercase tracking-[.3em] text-[#7b8492]'}>{footerLabel}</p>
        <h2 className="mt-4 font-display text-4xl tracking-[-.03em] md:text-5xl">Stay a little longer.</h2>
        <p className={isBar ? 'mx-auto mt-4 max-w-lg text-sm leading-7 text-white/40' : 'mx-auto mt-4 max-w-lg text-sm leading-7 text-[#687181]'}>Good food, good drinks and a space worth settling into.</p>
        {showAnnexNavigation && (
          <nav aria-label="Annex dining links" className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-[10px] uppercase tracking-[.16em] text-[#b98d37]">
            <a href="/annex/restaurant">Annex Restaurant</a>
            <a href="/annex/grilling">Grilling</a>
            <a href="/annex/outdoor-eatery">Outdoor Eatery</a>
            <a href="/annex/bar">Annex Bar</a>
            <a href="/annex/shortlets">Short-lets</a>
          </nav>
        )}
        <a href="#menu" className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b98d37] transition hover:gap-3">Back to menu <ArrowRight size={14} /></a>
      </section>
    </div>
  )
}
