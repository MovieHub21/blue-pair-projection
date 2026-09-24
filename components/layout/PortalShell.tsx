'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Search, ChevronDown, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import LiveDateTime from '../ui/LiveDateTime'
import NotificationBell from '../account/NotificationBell'
import BackButton from '../ui/BackButton'
import { getPortalBackTarget, labelForPath, normalizePath } from '../../lib/backNavigation'

export interface PortalNavItem { href: string; label: string; icon: ReactNode; end?: boolean }
export interface PortalNavGroup { label?: string; items: PortalNavItem[] }

export default function PortalShell({ portalName, portalTag, groups, userName, userRole, children }: { portalName: string; portalTag: string; groups: PortalNavGroup[]; userName: string; userRole: string; children: ReactNode }) {
  const [open, setOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false); const router = useRouter(); const pathname = usePathname()
  const isActive = (href: string, end?: boolean) => end ? pathname === href : pathname.startsWith(href)
  const allItems = groups.flatMap(g => g.items)
  const portalHome = groups[0]?.items[0]?.href || '/'
  // The bell shows guest updates in the guest portal and department work updates in every staff portal.
  const isGuestPortal = pathname.startsWith('/account')
  // Sidebar pages get no back button; any other page goes back to its closest sidebar parent (or the portal home).
  const backTarget = getPortalBackTarget(pathname, allItems.map(item => item.href), portalHome)
  const backLabel = backTarget ? (allItems.find(item => normalizePath(item.href) === normalizePath(backTarget))?.label || labelForPath(backTarget)) : ''
  async function signOut() { setMenuOpen(false); await supabase.auth.signOut(); router.push('/'); router.refresh() }
  return <div className="portal-shell min-h-screen flex">
    <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-navy-950/95 text-white backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3.5 py-2.5">
      <button onClick={() => setOpen(true)} aria-label="Open navigation" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 active:bg-white/10"><Menu size={20} strokeWidth={1.7} /></button>
      <Link href="/" aria-label="Blue Pair Signature Hotels" className="flex min-w-0 items-center gap-2.5 px-2">
        <img src="/icon-192.png" alt="Blue Pair Signature Hotels" className="w-8 h-8 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0 text-left leading-none">
          <span className="block truncate font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-white">Blue Pair</span>
          <span className="block truncate mt-0.5 text-[7px] font-semibold uppercase tracking-[0.22em] text-gold-400">Signature Hotels</span>
        </span>
      </Link>
      <div className="flex items-center gap-1.5 shrink-0"><div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10"><NotificationBell scope={isGuestPortal ? 'guest' : 'staff'} viewAllHref={isGuestPortal ? '/account/notifications' : '/admin/notifications'} /></div><button onClick={() => setMenuOpen(v => !v)} aria-label="Open user menu" aria-expanded={menuOpen} className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-gold-600 to-gold-300 p-[1px]"><span className="w-full h-full rounded-full bg-navy-900 text-gold-200 text-[10px] font-bold flex items-center justify-center">{userName.split(' ').map(n => n[0]).join('')}</span></button></div>
      {menuOpen && <div className="absolute top-full right-3 pt-2 w-[calc(100vw-24px)] max-w-56 z-50"><div className="bg-white rounded-xl2 shadow-pop border border-black/5 p-2 text-navy-600"><button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 text-left"><LogOut size={14} /> Sign out</button></div></div>}
    </div>
    <aside className={'fixed lg:sticky top-0 h-screen w-72 bg-navy-950 text-white/70 flex flex-col z-50 transition-transform duration-200 ' + (open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
      <div className="flex items-center justify-between px-6 py-6"><div><Link href="/" aria-label="Blue Pair Hotel" className="flex items-center"><img src="/icon-192.png" alt="Blue Pair Hotel" className="w-10 h-10 rounded-xl object-cover" /></Link><span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">{portalTag}</span></div><button onClick={() => setOpen(false)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10" aria-label="Close navigation"><X size={18} /></button></div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-6">{groups.map((g, i) => <div key={i}>{g.label && <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold px-3 mb-2">{g.label}</div>}<div className="flex flex-col gap-0.5">{g.items.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ' + (isActive(item.href, item.end) ? 'bg-white/10 text-white' : 'hover:text-white hover:bg-white/5')}>{item.icon}{item.label}</Link>)}</div></div>)}</div>
      <div className="p-4 border-t border-white/10"><a href="https://bluepairsignature.com/" className="block w-full text-left px-3 py-2.5 rounded-lg text-[13px] hover:bg-white/5 hover:text-white">← Exit to public site</a></div>
    </aside>
    {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}
    <div className="flex-1 min-w-0 pt-14 lg:pt-0">
      <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-navy-900/5 sticky top-0 z-30"><div className="flex items-center gap-5 min-w-0"><div className="flex items-center gap-2 text-navy-400 text-sm w-64 bg-cream-100 rounded-full px-4 py-2"><Search size={15} /><span className="text-xs">Search {portalName.toLowerCase()}…</span></div><div className="text-navy-500 truncate"><LiveDateTime /></div></div><div className="flex items-center gap-5"><NotificationBell scope={isGuestPortal ? 'guest' : 'staff'} viewAllHref={isGuestPortal ? '/account/notifications' : '/admin/notifications'} /><div className="relative" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}><button className="flex items-center gap-2.5 pl-4 border-l border-black/10"><div className="w-9 h-9 rounded-full bg-navy-900 text-gold-400 text-xs font-bold flex items-center justify-center">{userName.split(' ').map(n => n[0]).join('')}</div><div className="text-xs text-left"><div className="font-semibold text-navy-900">{userName}</div><div className="text-navy-400">{userRole}</div></div><ChevronDown size={14} className="text-navy-400" /></button>{menuOpen && <div className="absolute top-full right-0 pt-2 w-56 z-40"><div className="bg-white rounded-xl2 shadow-pop border border-black/5 p-2"><div className="max-h-72 overflow-y-auto flex flex-col gap-0.5">{allItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium ' + (isActive(item.href, item.end) ? 'bg-cream-100 text-navy-900' : 'text-navy-600 hover:bg-cream-100')}>{item.icon}{item.label}</Link>)}</div><div className="border-t border-black/5 mt-1.5 pt-1.5"><button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 text-left"><LogOut size={14} />Sign out</button></div></div></div>}</div></div></div>
      <main className={"p-4 md:p-8 lg:p-9 " + (isGuestPortal ? "max-w-[1320px]" : "max-w-[1600px]")}>
        {backTarget && <div className="mb-5"><BackButton href={backTarget} label={backLabel} /></div>}
        {children}
      </main>
    </div>
  </div>
}
