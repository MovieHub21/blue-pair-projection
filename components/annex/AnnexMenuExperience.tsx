'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { naira } from '../../lib/format'
import { DISH_NOUNS, DRINK_NOUNS, MenuBrowser, MenuClosing, MenuHero, countLabel } from '../menu/MenuKit'

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
  outlet: 'bar' | 'restaurant' | 'grilling' | 'outdoor_eatery'
  showAnnexNavigation?: boolean
  footerLabel?: string
  activeBookings?: { id: string; type: 'room' | 'short_let'; label: string; reference: string }[]
}

export default function AnnexMenuExperience({ title, eyebrow, description, heroImage, items, mode, outlet, showAnnexNavigation = true, footerLabel = 'Blue Pair Hotel · The Annex', activeBookings = [] }: Props) {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([])
  const [showOrder, setShowOrder] = useState(false)
  const [location, setLocation] = useState<'room' | 'short_let' | 'bar' | 'outdoor_eatery' | 'vip_lounge' | ''>('')
  const [takeout, setTakeout] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [notes, setNotes] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const outletName = outlet === 'bar' ? 'Annex Bar' : outlet === 'restaurant' ? 'Annex Restaurant' : outlet === 'grilling' ? 'Annex Grilling' : 'Outdoor Eatery'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showOrder) return
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [showOrder])

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
    if (!takeout && !location) return setOrderMessage('Choose where you want your order served.')
    if (takeout && !deliveryAddress.trim()) return setOrderMessage('Enter the delivery address for your takeaway order.')
    if ((location === 'room' || location === 'short_let') && !bookingId) return setOrderMessage('Select the current booking for that delivery location.')
    setPlacing(true); setOrderMessage('')
    try {
      const response = await fetch('/api/bar/orders/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outlet, items: cart.map(x => ({ id: x.id, name: x.name, quantity: x.quantity })), location, bookingId: bookingId || null, takeout, notes, contactEmail, contactPhone, deliveryAddress }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || 'Unable to start payment.')
      window.location.href = result.authorizationUrl
    } catch (error: any) {
      setOrderMessage(error?.message || 'Unable to start payment.')
      setPlacing(false)
    }
  }

  const nouns = mode === 'bar' ? DRINK_NOUNS : DISH_NOUNS
  const heroPicture = heroImage || items.find(item => item.image)?.image

  const orderControl = (item: AnnexMenuItem) => {
    const inCart = cartItem(item.id)
    return inCart ? (
      <div className="flex items-center gap-1 rounded-full border border-gold-500/50 bg-gold-400/15 p-1">
        <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-900/15 bg-white text-sm text-navy-900">−</button>
        <span className="w-5 text-center text-xs font-semibold">{inCart.quantity}</span>
        <button type="button" aria-label={`Add one more ${item.name}`} onClick={() => addToOrder(item)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold text-navy-950">+</button>
      </div>
    ) : (
      <button type="button" onClick={() => addToOrder(item)} className="rounded-full bg-navy-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white transition hover:bg-navy-800">Add</button>
    )
  }

  return (
    <div className="bg-cream-50 text-navy-900">
      <MenuHero eyebrow={eyebrow} kicker="The Annex · Blue Pair" title={title} description={description} image={heroPicture} meta={countLabel(items.length, nouns)} />

      <MenuBrowser
        items={items}
        nouns={nouns}
        label={title}
        renderAction={orderControl}
        note="Prices are in Nigerian naira. Add items to your order and check out when you are ready."
      />

      <MenuClosing
        eyebrow={footerLabel}
        title="Stay a little longer."
        description="Good food, good drinks and a space worth settling into."
        actions={[{ label: 'Book a room', href: '/rooms', primary: true }, { label: 'Dining at Blue Pair', href: '/dining' }]}
        links={showAnnexNavigation ? [
          { label: 'Annex Restaurant', href: '/annex/restaurant' },
          { label: 'Grilling', href: '/annex/grilling' },
          { label: 'Outdoor Eatery', href: '/annex/outdoor-eatery' },
          { label: 'Annex Bar', href: '/annex/bar' },
          { label: 'Short-lets', href: '/annex/shortlets' },
        ] : undefined}
        bottomInset
      />
      {mounted && createPortal(
        <>
          <>
              <div className="fixed inset-x-0 bottom-0 z-[90] isolate border-t border-white/10 bg-[#060B17]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
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
                <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-center overflow-hidden overscroll-none bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6">
                  <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain bg-[#0A1229] p-6 text-white shadow-2xl md:rounded-2xl md:p-8">
                    <div className="flex items-start justify-between gap-5">
                      <div><span className="text-[10px] uppercase tracking-[.25em] text-[#d7b66a]">{outletName}</span><h2 className="mt-2 font-display text-4xl">Your order</h2></div>
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
                        ].map(([value,label]) => <button key={value} type="button" onClick={() => { if (takeout) return; setLocation(value as any); if (value !== 'room' && value !== 'short_let') setBookingId('') }} disabled={takeout} className={location === value ? 'rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-4 text-left' : takeout ? 'cursor-not-allowed rounded-xl border border-white/5 bg-white/[.02] p-4 text-left opacity-40' : 'rounded-xl border border-white/10 bg-white/[.03] p-4 text-left'}><span className="block text-sm font-semibold">{label}</span>{(value === 'room' || value === 'short_let') ? <span className="mt-1 block text-xs text-white/35">{activeBookings.filter(b => b.type === value).length ? 'Choose your active booking below' : 'No active booking'}</span> : <span className="mt-1 block text-xs text-white/35">{activeBookings.length ? 'Available during your stay' : 'Venue service'}</span>}</button>)}
                      </div>
                      <label className={takeout ? 'mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-4' : 'mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4'}>
                    <input type="checkbox" checked={takeout} onChange={e => { const checked = e.target.checked; setTakeout(checked); if (checked) { setLocation(''); setBookingId('') } }} className="h-4 w-4 accent-[#d7b66a]" />
                    <span><span className="block text-sm font-semibold">Order as takeaway</span><span className="mt-1 block text-xs text-white/35">We will arrange delivery to the address you provide. Contact details are required.</span></span>
                  </label>
                  {(location === 'room' || location === 'short_let') && <div className="mt-3 space-y-2">{activeBookings.filter(b => b.type === location).map(b => <button type="button" key={b.id} onClick={() => setBookingId(b.id)} className={bookingId === b.id ? 'w-full rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-4 text-left' : 'w-full rounded-xl border border-white/10 p-4 text-left'}><span className="block font-semibold">{b.label}</span><span className="mt-1 block text-[10px] uppercase tracking-[.14em] text-white/35">{b.reference} · Current stay</span></button>)}{!activeBookings.some(b => b.type === location) && <p className="rounded-xl border border-white/10 p-4 text-xs text-white/40">You do not have an active {location === 'room' ? 'room' : 'short-let'} booking available for delivery.</p>}</div>}
                      <div className="mt-7"> 
                        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7b66a]"> Order for takeaway / delivery? </p>
                      </div>
                      {takeout && (
                    <>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email address *" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                        <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number *" className="w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                      </div>
                      <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={3} placeholder="Delivery address *" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special instructions (optional)" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white outline-none placeholder:text-white/25" />
                    </>
                  )}
                    </div>
                    {orderMessage && <p className="mt-4 rounded-xl border border-[#d7b66a]/20 bg-[#d7b66a]/5 p-3 text-sm text-[#e3c77d]">{orderMessage}</p>}
                    <div className="mt-7 flex items-center justify-between gap-5 border-t border-white/10 pt-5"><div><span className="text-xs text-white/40">Total</span><p className="font-display text-2xl">{naira(cartTotal)}</p></div><button type="button" disabled={!cart.length || placing || (!takeout && !location) || (takeout && (!contactEmail.trim() || !contactPhone.trim() || !deliveryAddress.trim())) || ((location === 'room' || location === 'short_let') && !activeBookings.some(b => b.id === bookingId))} onClick={() => void submitOrder()} className="rounded-full bg-[#d7b66a] px-6 py-3 text-xs font-bold text-[#08101d] disabled:cursor-not-allowed disabled:opacity-40">{placing ? 'Placing order…' : 'Place order'}</button></div>
                  </div>
                </div>
              )}
            </>
        </>,
        document.body,
      )}
    </div>
  )
}
