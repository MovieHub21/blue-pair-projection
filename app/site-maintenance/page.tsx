import { Wrench, Clock3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SiteMaintenancePage() {
  return (
    <main className="min-h-screen bg-navy-950 text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-gold-400">
          <Wrench size={28} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold-400 font-semibold">Blue Pair Signature Crown Hotel & Suites</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-4">We’ll be back shortly.</h1>
        <p className="text-white/65 leading-7 mt-5 max-w-xl mx-auto">
          We’re making a few improvements to the Blue Pair website and guest services. The hotel team is still working behind the scenes, and we’ll have everything ready again soon.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/60">
          <Clock3 size={14} />
          Website maintenance in progress
        </div>
        <p className="text-[11px] text-white/35 mt-10">Thank you for your patience.</p>
      </div>
    </main>
  )
}
