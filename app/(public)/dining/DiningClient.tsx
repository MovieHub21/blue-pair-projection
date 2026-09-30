'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { MenuItem } from '../../../data/mock'
import { naira } from '../../../lib/format'
import { MenuBrowser, MenuClosing, MenuHero, countLabel, heroGhostButton, DISH_NOUNS } from '../../../components/menu/MenuKit'
import type { AnnexActiveBooking } from '../../../lib/annexOrders'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80'

const VENUES = [
  { outlet: 'Blue Pair Restaurant', tag: 'Fine dining', blurb: 'Nigerian classics and continental favourites.', apiOutlet: 'restaurant' },
  { outlet: 'Outdoor Bar & Eatery', tag: 'Casual & al fresco', blurb: 'Small chops, grilled favourites and cold drinks.', apiOutlet: 'outdoor_eatery' },
] as const

type Outlet = typeof VENUES[number]['outlet']
type CartEntry = { id: string; name: string; price: number; quantity: number; venue?: string }

const STORAGE_KEY = 'bluepair_dining_cart'

export default function DiningClient({ menuItems, activeBookings = [] }: { menuItems: MenuItem[]; activeBookings?: AnnexActiveBooking[] }) {
  const [outlet, setOutlet] = useState<Outlet>('Blue Pair Restaurant')
  const [cart, setCart] = useState<CartEntry[]>([])
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

  // Restore cart on mount
  useEffect(() => {
    setMounted(true)
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length) setCart(parsed)
      }
    } catch {}
  }, [])

  // Persist cart on update
  useEffect(() => {
    if (!mounted) return
    try {
      const serialized = JSON.stringify(cart)
      sessionStorage.setItem(STORAGE_KEY, serialized)
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch {}
  }, [cart, mounted])

  useEffect(() => {
    if (!showOrder) return
    const prev = { body: document.body.style.overflow, html: document.documentElement.style.overflow }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev.body
      document.documentElement.style.overflow = prev.html
    }
  }, [showOrder])

  const venueItems = useMemo(
    () =>
      Object.fromEntries(VENUES.map(v => [v.outlet, menuItems.filter(item => item.outlet === v.outlet)])) as Record<
        Outlet,
        MenuItem[]
      >,
    [menuItems]
  )
  const items = venueItems[outlet]

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const addToOrder = (item: MenuItem) => {
    if (!item.available) return
    setCart(cur => {
      const ex = cur.find(x => x.id === item.id)
      return ex
        ? cur.map(x => (x.id === item.id ? { ...x, quantity: Math.min(50, x.quantity + 1) } : x))
        : [...cur, { id: item.id, name: item.name, price: item.price, quantity: 1, venue: outlet }]
    })
    setOrderMessage('')
  }

  const updateQuantity = (id: string, delta: number) =>
    setCart(cur =>
      cur
        .map(x => (x.id === id ? { ...x, quantity: Math.max(0, Math.min(50, x.quantity + delta)) } : x))
        .filter(x => x.quantity > 0)
    )

  const cartItem = (id: string) => cart.find(x => x.id === id)

  // Switching venue switches the menu view WITHOUT clearing the cart!
  const switchVenue = (v: Outlet) => {
    setOutlet(v)
  }

  const submitOrder = async () => {
    if (!cart.length) return
    if (!takeout && !location) return setOrderMessage('Choose where you want your order served.')
    if (takeout && !deliveryAddress.trim()) return setOrderMessage('Enter the delivery address for your takeaway order.')
    if ((location === 'room' || location === 'short_let') && !bookingId)
      return setOrderMessage('Select the current booking for that delivery location.')
    if ((location === 'room' || location === 'short_let') && !activeBookings.some(b => b.id === bookingId))
      return setOrderMessage('Select one of your active bookings for delivery.')
    setPlacing(true)
    setOrderMessage('')
    try {
      const response = await fetch('/api/bar/orders/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet: 'restaurant',
          items: cart.map(x => ({ id: x.id, name: x.name, quantity: x.quantity })),
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
      try {
        sessionStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
      window.location.href = result.authorizationUrl
    } catch (error: any) {
      setOrderMessage(error?.message || 'Unable to start payment.')
      setPlacing(false)
    }
  }

  const orderControl = (item: MenuItem) => {
    const inCart = cartItem(item.id)
    return inCart ? (
      <div className="flex items-center gap-1 rounded-full border border-gold-500/50 bg-gold-400/15 p-0.5 md:p-1">
        <button
          type="button"
          aria-label={`Remove one ${item.name}`}
          onClick={() => updateQuantity(item.id, -1)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-navy-900/15 bg-white text-sm text-navy-900 md:h-7 md:w-7"
        >
          −
        </button>
        <span className="w-4 text-center text-xs font-semibold md:w-5">{inCart.quantity}</span>
        <button
          type="button"
          aria-label={`Add one more ${item.name}`}
          onClick={() => addToOrder(item)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold text-navy-950 md:h-7 md:w-7"
        >
          +
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => addToOrder(item)}
        className="rounded-full bg-navy-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white transition hover:bg-navy-800 md:px-4 md:py-2"
      >
        Add
      </button>
    )
  }

  return (
    <div className="bg-cream-50 text-navy-900">
      <MenuHero
        eyebrow="Food & drink"
        kicker="Uromi, Edo State"
        title="Dining at Blue Pair"
        description="Nigerian classics and continental favourites at the restaurant, and small chops, grills and cold drinks at the Outdoor Bar & Eatery."
        image={HERO_IMAGE}
        overlap
        actions={
          <Link href="/contact" className={heroGhostButton}>
            Contact us
          </Link>
        }
      />

      {/* Where would you like to dine? Overlaps the hero. */}
      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 md:-mt-32 md:px-10">
        <div className="grid gap-2.5 md:grid-cols-2 md:gap-5" role="group" aria-label="Choose where you would like to dine">
          {VENUES.map(option => {
            const active = option.outlet === outlet
            const venueCartCount = cart
              .filter(x => x.venue === option.outlet || venueItems[option.outlet].some(item => item.id === x.id))
              .reduce((s, x) => s + x.quantity, 0)

            return (
              <button
                key={option.outlet}
                type="button"
                aria-pressed={active}
                onClick={() => switchVenue(option.outlet)}
                className={
                  'group relative overflow-hidden rounded-xl border p-4 text-left transition duration-300 md:p-7 ' +
                  (active
                    ? 'border-gold-400 bg-navy-800 text-white shadow-[0_24px_60px_-24px_rgba(6,11,23,.7)]'
                    : 'border-navy-900/10 bg-white text-navy-900 shadow-[0_18px_40px_-26px_rgba(6,11,23,.35)] hover:-translate-y-0.5 hover:border-gold-400')
                }
              >
                <span
                  className={
                    'absolute inset-x-0 top-0 h-[3px] transition ' +
                    (active ? 'bg-gold-400' : 'bg-transparent group-hover:bg-gold-400/60')
                  }
                />
                <div className="flex items-center justify-between">
                  <span className={'text-[10px] font-semibold uppercase tracking-[.24em] ' + (active ? 'text-gold-400' : 'text-gold-600')}>
                    {option.tag}
                  </span>
                  {venueCartCount > 0 && (
                    <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-navy-950">
                      {venueCartCount} in cart
                    </span>
                  )}
                </div>
                <span className="mt-1.5 block font-display text-xl leading-tight md:mt-2 md:text-3xl">{option.outlet}</span>
                <span className={'mt-1.5 block max-w-sm text-sm leading-6 md:mt-2 ' + (active ? 'text-white/70' : 'text-navy-900/60')}>
                  {option.blurb}
                </span>
                <span
                  className={
                    'mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] md:mt-5 ' +
                    (active ? 'text-white/90' : 'text-navy-900/70')
                  }
                >
                  {countLabel(venueItems[option.outlet].length)}
                  <span className={'h-px w-6 md:w-8 ' + (active ? 'bg-gold-400' : 'bg-navy-900/25')} />
                  {active ? 'Viewing' : 'View menu'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Keyed by venue, so the course filter and search start fresh when the venue changes. */}
      <MenuBrowser
        key={outlet}
        items={items}
        nouns={DISH_NOUNS}
        label={outlet}
        renderAction={orderControl}
        note="Prices are in Nigerian naira. Pick from both restaurant and outdoor eatery — your cart keeps all items."
      />

      <MenuClosing
        title="Dine with us, stay with us."
        description="Book a room and the restaurant is right here. Or head to The Annex for grills, drinks and nightlife."
        actions={[
          { label: 'Book a room', href: '/rooms', primary: true },
          { label: 'Explore The Annex', href: '/annex' },
        ]}
      />

      {/* ── Checkout bar + order panel ── */}
      {mounted &&
        createPortal(
          <>
            {/* Fixed bottom bar */}
            <div className="fixed inset-x-0 bottom-0 z-[90] isolate border-t border-white/10 bg-[#060B17]/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl md:px-4 md:py-3">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:gap-4">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[.2em] text-white/35 md:text-[9px]">
                    Your order · {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </p>
                  <p className="truncate font-display text-base text-white md:text-lg">{naira(cartTotal)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrder(true)}
                  disabled={!cart.length}
                  className="shrink-0 rounded-full bg-[#d7b66a] px-5 py-2.5 text-[11px] font-bold text-[#08101d] shadow-lg disabled:cursor-not-allowed disabled:opacity-35 md:px-6 md:py-3 md:text-xs"
                >
                  Checkout ({cartCount})
                </button>
              </div>
            </div>

            {/* Order panel */}
            {showOrder && (
              <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-center overflow-hidden overscroll-none bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6">
                <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain bg-[#0A1229] px-4 py-5 text-white shadow-2xl md:rounded-2xl md:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[.25em] text-[#d7b66a]">
                        Dining at Blue Pair · Combined Order
                      </span>
                      <h2 className="mt-1 font-display text-3xl md:mt-2 md:text-4xl">Your order</h2>
                    </div>
                    <button type="button" onClick={() => setShowOrder(false)} className="mt-1 text-xs text-white/50 md:text-sm">
                      Close
                    </button>
                  </div>

                  {/* Cart items */}
                  <div className="mt-5 divide-y divide-white/10 border-y border-white/10 md:mt-7">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-3 md:gap-4 md:py-4">
                        <div>
                          <p className="font-display text-lg md:text-xl">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.venue && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d7b66a]">
                                {item.venue}
                              </span>
                            )}
                            <span className="text-xs text-white/40">{naira(item.price)} each</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-7 w-7 rounded-full border border-white/15 text-sm md:h-8 md:w-8"
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-sm md:w-5">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-7 w-7 rounded-full border border-white/15 text-sm md:h-8 md:w-8"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {!cart.length && <p className="py-6 text-sm text-white/40 md:py-8">Your order is empty.</p>}
                  </div>

                  {/* Delivery options */}
                  <div className="mt-5 md:mt-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7b66a]">
                      Where should we serve it? <span className="text-red-400">*</span>
                    </p>
                    <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 md:mt-3 md:gap-2">
                      {([
                        ['room', 'Room'],
                        ['short_let', 'Short-let'],
                        ['outdoor_eatery', 'Outdoor Eatery'],
                        ['vip_lounge', 'VIP Lounge'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            if (takeout) return
                            setLocation(value as any)
                            if (value !== 'room' && value !== 'short_let') setBookingId('')
                          }}
                          disabled={takeout}
                          className={
                            location === value
                              ? 'rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3 text-left md:p-4'
                              : takeout
                              ? 'cursor-not-allowed rounded-xl border border-white/5 bg-white/[.02] p-3 text-left opacity-40 md:p-4'
                              : 'rounded-xl border border-white/10 bg-white/[.03] p-3 text-left md:p-4'
                          }
                        >
                          <span className="block text-sm font-semibold">{label}</span>
                          <span className="mt-0.5 block text-xs text-white/35">
                            {value === 'room' || value === 'short_let'
                              ? 'Delivered to your room / short-let'
                              : 'Serve at venue'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Takeaway */}
                    <label
                      className={
                        takeout
                          ? 'mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3 md:mt-3 md:p-4'
                          : 'mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 md:mt-3 md:p-4'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={takeout}
                        onChange={e => {
                          const checked = e.target.checked
                          setTakeout(checked)
                          if (checked) {
                            setLocation('')
                            setBookingId('')
                          }
                        }}
                        className="h-4 w-4 accent-[#d7b66a]"
                      />
                      <span>
                        <span className="block text-sm font-semibold">Order as takeaway</span>
                        <span className="mt-0.5 block text-xs text-white/35">
                          Delivery to an address. Contact details required.
                        </span>
                      </span>
                    </label>

                    {/* Active bookings */}
                    {(location === 'room' || location === 'short_let') && (
                      <div className="mt-2.5 space-y-2 md:mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">
                          Your active {location === 'room' ? 'room' : 'short-let'} bookings
                        </p>
                        {activeBookings
                          .filter(b => b.type === location)
                          .map(booking => (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={() => setBookingId(booking.id)}
                              className={
                                bookingId === booking.id
                                  ? 'w-full rounded-xl border border-[#d7b66a] bg-[#d7b66a]/10 p-3 text-left md:p-4'
                                  : 'w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-left md:p-4'
                              }
                            >
                              <span className="block text-sm font-semibold">{booking.label}</span>
                              <span className="mt-0.5 block text-xs text-white/35">Ref: {booking.reference}</span>
                            </button>
                          ))}
                        {!activeBookings.some(b => b.type === location) && (
                          <p className="rounded-xl border border-white/10 p-3 text-xs text-white/40 md:p-4">
                            No active {location === 'room' ? 'room' : 'short-let'} booking is available for delivery.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Takeaway fields */}
                    {takeout && (
                      <>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 md:mt-4 md:gap-3">
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            placeholder="Email address *"
                            className="w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-white outline-none placeholder:text-white/25 md:p-4"
                          />
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                            placeholder="Phone number *"
                            className="w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-white outline-none placeholder:text-white/25 md:p-4"
                          />
                        </div>
                        <textarea
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          rows={2}
                          placeholder="Delivery address *"
                          className="mt-2.5 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-white outline-none placeholder:text-white/25 md:mt-3 md:p-4"
                        />
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          rows={2}
                          placeholder="Special instructions (optional)"
                          className="mt-2.5 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-white outline-none placeholder:text-white/25 md:mt-3 md:p-4"
                        />
                      </>
                    )}
                  </div>

                  {orderMessage && (
                    <p className="mt-3 rounded-xl border border-[#d7b66a]/20 bg-[#d7b66a]/5 p-3 text-sm text-[#e3c77d] md:mt-4">
                      {orderMessage}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4 md:mt-7 md:gap-5 md:pt-5">
                    <div>
                      <span className="text-xs text-white/40">Total</span>
                      <p className="font-display text-xl md:text-2xl">{naira(cartTotal)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        !cart.length ||
                        placing ||
                        (!takeout && !location) ||
                        (takeout && (!contactEmail.trim() || !contactPhone.trim() || !deliveryAddress.trim())) ||
                        ((location === 'room' || location === 'short_let') && !activeBookings.some(b => b.id === bookingId))
                      }
                      onClick={() => void submitOrder()}
                      className="rounded-full bg-[#d7b66a] px-5 py-2.5 text-xs font-bold text-[#08101d] disabled:cursor-not-allowed disabled:opacity-40 md:px-6 md:py-3"
                    >
                      {placing ? 'Placing order…' : 'Place order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  )
}
