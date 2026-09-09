'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Bell, Search, ChevronDown } from 'lucide-react'

export interface PortalNavItem { href: string; label: string; icon: ReactNode; end?: boolean }
export interface PortalNavGroup { label?: string; items: PortalNavItem[] }

export default function PortalShell({
  portalName, portalTag, groups, userName, userRole, children,
}: {
  portalName: string; portalTag: string; groups: PortalNavGroup[]; userName: string; userRole: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string, end?: boolean) => end ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex bg-cream-100">
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-navy-950 text-white flex items-center justify-between px-4 py-3.5">
        <button onClick={() => setOpen(true)}><Menu size={20} /></button>
        <span className="font-display text-sm font-semibold">{portalName}</span>
        <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 text-[11px] font-bold flex items-center justify-center">{userName.split(' ').map(n=>n[0]).join('')}</div>
      </div>

      <aside className={
        'fixed lg:sticky top-0 h-screen w-72 bg-navy-950 text-white/70 flex flex-col z-50 transition-transform duration-200 ' +
        (open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
      }>
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-gold-500" />Blue Pair
            </Link>
            <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">{portalTag}</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-6">
          {groups.map((g, i) => (
            <div key={i}>
              {g.label && <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold px-3 mb-2">{g.label}</div>}
              <div className="flex flex-col gap-0.5">
                {g.items.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ' +
                    (isActive(item.href, item.end) ? 'bg-white/10 text-white' : 'hover:text-white hover:bg-white/5')
                  }>
                    {item.icon}{item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => router.push('/')} className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] hover:bg-white/5 hover:text-white">← Exit to public site</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-black/5 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-navy-400 text-sm w-80 bg-cream-100 rounded-full px-4 py-2">
            <Search size={15} /><span className="text-xs">Search {portalName.toLowerCase()}…</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative"><Bell size={18} className="text-navy-600" /><span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-[9px] font-bold text-navy-950 flex items-center justify-center">3</span></button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-black/10">
              <div className="w-9 h-9 rounded-full bg-navy-900 text-gold-400 text-xs font-bold flex items-center justify-center">{userName.split(' ').map(n=>n[0]).join('')}</div>
              <div className="text-xs">
                <div className="font-semibold text-navy-900">{userName}</div>
                <div className="text-navy-400">{userRole}</div>
              </div>
              <ChevronDown size={14} className="text-navy-400" />
            </div>
          </div>
        </div>
        <div className="p-5 md:p-8">{children}</div>
      </div>
    </div>
  )
}
