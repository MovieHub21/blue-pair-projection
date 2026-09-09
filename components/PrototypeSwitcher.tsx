'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, X, Globe, User, ShieldCheck, ConciergeBell, Sparkles, Wrench, BarChart3 } from 'lucide-react'

const portals = [
  { to: '/', label: 'Public Website', icon: Globe, desc: 'Home, rooms, dining, amenities' },
  { to: '/booking', label: 'Customer Booking', icon: ConciergeBell, desc: 'Live booking flow' },
  { to: '/account/dashboard', label: 'Customer Account', icon: User, desc: 'Guest dashboard' },
  { to: '/admin/dashboard', label: 'Admin', icon: ShieldCheck, desc: 'Full hotel management' },
  { to: '/reception/dashboard', label: 'Reception', icon: ConciergeBell, desc: 'Front desk portal' },
  { to: '/housekeeping/dashboard', label: 'Housekeeping', icon: Sparkles, desc: 'Cleaner portal' },
  { to: '/maintenance/dashboard', label: 'Maintenance', icon: Wrench, desc: 'Facilities portal' },
  { to: '/admin/reports/revenue', label: 'Reports', icon: BarChart3, desc: 'Analytics & reports' },
]

export default function PrototypeSwitcher() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="fixed bottom-5 right-5 z-[300]">
      {open && (
        <div className="mb-3 w-80 bg-navy-950 text-white rounded-2xl shadow-pop border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gold-400 font-bold">Prototype only — no login required</div>
              <div className="text-sm font-semibold">Jump to a portal</div>
            </div>
            <button onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="p-2 max-h-[60vh] overflow-y-auto">
            {portals.map(p => {
              const Icon = p.icon
              const active = p.to === '/' ? pathname === '/' : pathname.startsWith(p.to.split('/').slice(0,2).join('/'))
              return (
                <button key={p.to} onClick={() => { router.push(p.to); setOpen(false) }}
                  className={'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors ' + (active ? 'bg-white/10' : 'hover:bg-white/5')}>
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-gold-400" /></div>
                  <div>
                    <div className="text-[13.5px] font-semibold">{p.label}</div>
                    <div className="text-[11px] text-white/45">{p.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-gold-500 text-navy-950 font-bold text-xs px-4 py-3 rounded-full shadow-pop hover:bg-gold-600">
        <LayoutGrid size={15} />{open ? 'Close switcher' : 'Prototype Switcher'}
      </button>
    </div>
  )
}
