'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { Menu, X, ChevronDown, User, LayoutGrid, LogOut, Headset, ArrowRight, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { initials } from '../../lib/format'
import NotificationBell from '../account/NotificationBell'

const COMPANY_NAME = 'Blue Pair Signature Crown Hotel & Suites'

const explore = [
  { href: '/dining', label: 'Restaurant' }, 
  { href: '/vip-lounge', label: 'VIP Bar' }, 
  { href: '/pool', label: 'Indoor Pool' },
  { href: '/gym', label: 'Gym' }, 
  { href: '/club', label: 'Club' }, 
  { href: '/games', label: 'Games' }, 
  { href: '/annex', label: 'The Annex' }, 
  { href: '/events', label: 'Events' },
]

export default function PublicNavbar() {
  const [open, setOpen] = useState(false); const [exploreOpen, setExploreOpen] = useState(false); const [accountOpen, setAccountOpen] = useState(false); const [showPaymentNotice, setShowPaymentNotice] = useState(false)
  const auth = useAuth(); const firstName = (auth.profile?.name || auth.customer?.name || '').split(' ')[0]
  const showAdminPortal = auth.roles.length > 0

  useEffect(() => {
    if (sessionStorage.getItem('bluePairPaymentSafetyNoticeShown') === 'true') return
    sessionStorage.setItem('bluePairPaymentSafetyNoticeShown', 'true')
    setShowPaymentNotice(true)
  }, [])

  useEffect(() => {
    if (!showPaymentNotice) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPaymentNotice(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showPaymentNotice])

  async function handleSignOut() { setAccountOpen(false); await auth.signOut() }
  return (
    <>
    <nav className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-black/5">
      <div className="flex items-center justify-between gap-3 bg-navy-950 px-4 py-2 md:px-10">
        <p className="min-w-0 text-[9px] font-medium leading-tight text-white/85 sm:text-xs">Looking for a more budget-friendly stay?</p>
        <Link href="/annex" className="btn-gold btn-sm flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-[10px] sm:text-xs">Try the Annex <ArrowRight size={12} /></Link>
      </div>
      <div className="flex justify-center border-b border-gold-500/20 bg-amber-50 px-3 py-2">
        <button
          type="button"
          onClick={() => setShowPaymentNotice(true)}
          className="inline-flex items-center gap-2 text-center text-[11px] font-semibold leading-4 text-navy-900 hover:text-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 sm:text-xs"
          aria-haspopup="dialog"
          aria-label="Open payment safety notice"
        >
          <ShieldAlert size={15} className="shrink-0 text-amber-700" aria-hidden="true" />
          Safety: Never pay into a personal account. 
        </button>
      </div>
      <div className="w-full flex items-center justify-between py-3.5 px-5 md:px-10">
        <Link href="/" aria-label={COMPANY_NAME} className="flex items-center gap-2.5 shrink-0 min-w-0">
          <img src="/icon-192.png" alt="Blue Pair Signature" className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover shrink-0" />
          <span className="text-[11px] sm:text-xs md:text-sm font-semibold leading-tight tracking-tight text-navy-900 max-w-[185px] sm:max-w-[240px] md:max-w-[285px]">{COMPANY_NAME}</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8 text-[13.5px] font-medium text-navy-700">
          <Link href="/rooms" className="opacity-75 hover:opacity-100">Rooms</Link>
          <Link href="/about" className="opacity-75 hover:opacity-100">About</Link>
          <div className="relative" onMouseEnter={() => setExploreOpen(true)} onMouseLeave={() => setExploreOpen(false)}><button className="flex items-center gap-1 opacity-75 hover:opacity-100">Explore <ChevronDown size={14} /></button>{exploreOpen && <div className="absolute top-full left-0 pt-3 w-52"><div className="card p-2 grid gap-0.5">{explore.map(e => <Link key={e.href} href={e.href} className="px-3 py-2 rounded-lg text-sm hover:bg-cream-100">{e.label}</Link>)}</div></div>}</div>
          <Link href="/offers" className="opacity-75 hover:opacity-100">Offers</Link><Link href="/blog" className="opacity-75 hover:opacity-100">Blog</Link><Link href="/gallery" className="opacity-75 hover:opacity-100">Gallery</Link><Link href="/contact" className="opacity-75 hover:opacity-100">Contact</Link>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/contact" aria-label="Contact support" title="Contact support" className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-navy-800 hover:bg-cream-100 transition-colors"><Headset size={17} /></Link>
          {auth.loading ? <div className="w-24 h-8 rounded-lg bg-black/5 animate-pulse" /> : auth.userId ? <div className="relative" onMouseEnter={() => setAccountOpen(true)} onMouseLeave={() => setAccountOpen(false)}><button className="flex items-center gap-2 text-[13.5px] font-semibold text-navy-800"><span className="w-7 h-7 rounded-full bg-navy-900 text-gold-400 text-[11px] font-bold flex items-center justify-center">{initials(firstName || 'G')}</span>{firstName || 'Account'} <ChevronDown size={14} /></button>{accountOpen && <div className="absolute top-full right-0 pt-3 w-52"><div className="card p-2 grid gap-0.5">
            <Link href="/account/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-cream-100"><LayoutGrid size={14} />Guest Portal</Link>
          {showAdminPortal && <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-cream-100"><LayoutGrid size={14} />Admin Portal</Link>}
          <Link href="/account/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-cream-100"><User size={14} />Profile</Link><button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-cream-100 text-left text-red-600"><LogOut size={14} />Sign out</button></div></div>}</div> : <Link href="/account/login" className="text-[13.5px] font-semibold text-navy-800">Sign in</Link>}
          <Link href="/booking" className="btn-gold btn-sm">Book a room</Link>
        </div>
        {auth.userId && <NotificationBell scope="guest" viewAllHref="/account/notifications" />}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          <Link href="/contact" aria-label="Contact support" title="Contact support" className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-navy-800 hover:bg-cream-100 transition-colors"><Headset size={17} /></Link>
          <button aria-label={open ? 'Close menu' : 'Open menu'} className="w-9 h-9 flex items-center justify-center" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <div className="lg:hidden px-6 pb-6 flex flex-col gap-1 text-sm font-medium max-h-[calc(100dvh-73px)] overflow-y-auto overscroll-contain">
        <Link href="/rooms" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Rooms</Link><Link href="/about" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">About</Link>
        {explore.map(e => <Link key={e.href} href={e.href} onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">{e.label}</Link>)}
        <Link href="/offers" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Offers</Link><Link href="/blog" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Blog</Link><Link href="/gallery" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Gallery</Link><Link href="/contact" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Contact</Link>
        {auth.userId && <Link href="/account/dashboard" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5">Guest Portal{firstName ? ` — ${firstName}` : ''}</Link>}
        {showAdminPortal && <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="py-2.5 border-b border-black/5 font-semibold text-navy-900">Admin Portal</Link>}
        
        <div className="flex gap-2 mt-4">{auth.userId ? <button onClick={() => { setOpen(false); handleSignOut() }} className="btn-outline btn-sm flex-1 justify-center">Sign out</button> : <Link href="/account/login" onClick={() => setOpen(false)} className="btn-outline btn-sm flex-1 justify-center">Sign in</Link>}<Link href="/booking" onClick={() => setOpen(false)} className="btn-gold btn-sm flex-1 justify-center">Book a room</Link></div>
      </div>}
    </nav>
    {showPaymentNotice && typeof document !== 'undefined' && createPortal(
      <div
        className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-navy-950/75 p-4 backdrop-blur-md sm:p-8"
        onClick={() => setShowPaymentNotice(false)}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Blue Pair payment safety notice"
          className="relative max-h-[92vh] max-w-3xl cursor-pointer overflow-auto rounded-xl shadow-2xl"
          onClick={() => setShowPaymentNotice(false)}
        >
          <img
            src="/images/alert.png"
            alt="Payment safety notice: Never pay money to a personal account. Before sending payment, confirm the account is an official Blue Pair Signature business account using the contact details on this website."
            className="block h-auto max-h-[92vh] w-auto max-w-full object-contain"
          />
          <span className="sr-only">Tap or click anywhere to close this notice.</span>
        </div>
      </div>,
      document.body,
    )}
    </>
  )
}
