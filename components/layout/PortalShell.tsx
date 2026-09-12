
'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

export interface PortalNavItem {
  href: string
  label: string
  icon: ReactNode
  end?: boolean
}

export interface PortalNavGroup {
  label?: string
  items: PortalNavItem[]
}

export default function PortalShell({
  portalName,
  portalTag,
  groups,
  userName,
  userRole,
  children,
}: {
  portalName: string
  portalTag: string
  groups: PortalNavGroup[]
  userName: string
  userRole: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string, end?: boolean) =>
    end ? pathname === href : pathname.startsWith(href)

  const allItems = groups.flatMap(g => g.items)

  async function signOut() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-cream-100">

      {/* MOBILE TOP BAR — mobile only */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-navy-950 text-white flex items-center justify-between px-4 py-3.5">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/10"
        >
          <Menu size={20} />
        </button>

        <span className="font-display text-sm font-semibold truncate max-w-[55%]">
          {portalName}
        </span>

        <button
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Open user menu"
          aria-expanded={menuOpen}
          className="w-8 h-8 shrink-0 rounded-full bg-gold-500 text-navy-950 text-[11px] font-bold flex items-center justify-center"
        >
          {userName
            .split(' ')
            .map(n => n[0])
            .join('')}
        </button>

        {/* MOBILE USER MENU */}
        {menuOpen && (
          <div className="absolute top-full right-3 pt-2 w-[calc(100vw-24px)] max-w-56 z-50">
            <div className="bg-white rounded-xl2 shadow-pop border border-black/5 p-2 text-navy-600">
              

              <div className="border-t border-black/5 ">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <aside
        className={
          'fixed lg:sticky top-0 h-screen w-72 bg-navy-950 text-white/70 flex flex-col z-50 transition-transform duration-200 ' +
          (open
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0')
        }
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-semibold text-white"
            >
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              Blue Pair
            </Link>

            <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">
              {portalTag}
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-6">
          {groups.map((g, i) => (
            <div key={i}>
              {g.label && (
                <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold px-3 mb-2">
                  {g.label}
                </div>
              )}

              <div className="flex flex-col gap-0.5">
                {g.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ' +
                      (isActive(item.href, item.end)
                        ? 'bg-white/10 text-white'
                        : 'hover:text-white hover:bg-white/5')
                    }
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => router.push('/')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] hover:bg-white/5 hover:text-white"
          >
            ← Exit to public site
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 pt-14 lg:pt-0">

        {/* DESKTOP HEADER — LEFT EXACTLY AS BEFORE */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-black/5 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-navy-400 text-sm w-80 bg-cream-100 rounded-full px-4 py-2">
            <Search size={15} />
            <span className="text-xs">
              Search {portalName.toLowerCase()}…
            </span>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative">
              <Bell size={18} className="text-navy-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-[9px] font-bold text-navy-950 flex items-center justify-center">
                3
              </span>
            </button>

            <div
              className="relative"
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button className="flex items-center gap-2.5 pl-4 border-l border-black/10">
                <div className="w-9 h-9 rounded-full bg-navy-900 text-gold-400 text-xs font-bold flex items-center justify-center">
                  {userName
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>

                <div className="text-xs text-left">
                  <div className="font-semibold text-navy-900">
                    {userName}
                  </div>
                  <div className="text-navy-400">
                    {userRole}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  className="text-navy-400"
                />
              </button>

              {menuOpen && (
                <div className="absolute top-full right-0 pt-2 w-56 z-40">
                  <div className="bg-white rounded-xl2 shadow-pop border border-black/5 p-2">
                    <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5">
                      {allItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium ' +
                            (isActive(item.href, item.end)
                              ? 'bg-cream-100 text-navy-900'
                              : 'text-navy-600 hover:bg-cream-100')
                          }
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-black/5 mt-1.5 pt-1.5">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT — DESKTOP PADDING UNCHANGED */}
        <div className="p-5 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

