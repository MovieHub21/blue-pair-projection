'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Beer, Flame, GlassWater, Martini, Sparkles, Utensils, Wine } from 'lucide-react'
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
}

const barIcons = [Martini, Wine, Beer, GlassWater]

export default function AnnexMenuExperience({ title, eyebrow, description, heroImage, items, mode }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(x => x.category).filter(Boolean)))], [items])
  const filtered = useMemo(() => activeCategory === 'All' ? items : items.filter(x => x.category === activeCategory), [activeCategory, items])
  const featured = items.slice(0, 3)
  const isBar = mode === 'bar'

  return (
    <div className={isBar ? 'bg-[#070b13] text-white' : 'bg-[#f8f5ef] text-navy-950'}>
      <section
        className="relative min-h-[590px] overflow-hidden flex items-end"
        style={{ backgroundImage: heroImage ? `url('${heroImage}')` : undefined, backgroundColor: isBar ? '#070b13' : '#e9e1d4', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className={isBar ? 'absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(199,154,62,.24),transparent_30%),linear-gradient(180deg,rgba(3,6,12,.2),#070b13_92%)]' : 'absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,54,.08),rgba(7,21,54,.88))]'} />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-gold-400/20" />
        <div className="absolute right-10 top-24 h-28 w-28 rounded-full border border-white/10" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-14 md:px-10 md:pb-16">
          <div className="max-w-3xl motion-fade-up">
            <div className="mb-4 flex items-center gap-3">
              <span className="eyebrow text-gold-300">{eyebrow}</span><span className="h-px w-12 bg-gold-400/70" />
              <span className="text-[10px] uppercase tracking-[.22em] text-white/45">Blue Pair · The Annex</span>
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[.95] tracking-[-.04em] text-white md:text-7xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/72 md:text-base">{description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#menu" className="btn-gold">Browse the menu <ArrowRight size={16} /></a>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur-md">{items.length} {isBar ? 'drinks' : 'menu items'}</span>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className={isBar ? 'border-b border-white/10 bg-[#0b111d]' : 'border-b border-navy-900/10 bg-white'}>
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            {featured.map((item, index) => {
              const Icon = barIcons[index % barIcons.length]
              return <div key={item.id} className="group relative min-h-[170px] overflow-hidden border-b border-inherit p-7 md:border-b-0 md:border-r last:border-r-0">
                {item.image && <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 transition duration-700 group-hover:scale-105 group-hover:opacity-40" />}
                {isBar && <div className="absolute right-7 top-7 flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10 text-gold-300"><Icon size={21} /></div>}
                <div className="relative z-10 flex h-full flex-col justify-end">
                  <span className={isBar ? 'text-[10px] uppercase tracking-[.18em] text-gold-300/75' : 'text-[10px] uppercase tracking-[.18em] text-gold-600'}>{item.category || 'Featured'}</span>
                  <h2 className={isBar ? 'mt-2 max-w-[75%] font-display text-2xl text-white' : 'mt-2 max-w-[75%] font-display text-2xl text-navy-950'}>{item.name}</h2>
                  <span className={isBar ? 'mt-2 font-display text-sm text-white/65' : 'mt-2 font-display text-sm text-navy-500'}>{naira(item.price)}</span>
                </div>
              </div>
            })}
          </div>
        </section>
      )}

      <section id="menu" className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className={isBar ? 'eyebrow text-gold-300' : 'eyebrow'}>{isBar ? 'Pour something good' : 'From the kitchen'}</div>
            <h2 className={isBar ? 'mt-2 font-display text-4xl text-white md:text-5xl' : 'mt-2 font-display text-4xl md:text-5xl'}>{isBar ? 'What are you having?' : 'Choose your craving.'}</h2>
            <p className={isBar ? 'mt-4 text-sm leading-6 text-white/55' : 'mt-4 text-sm leading-6 text-navy-500'}>Browse by category and find exactly what you came for.</p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {categories.map(category => <button key={category} type="button" onClick={() => setActiveCategory(category)}
              className={activeCategory === category ? 'shrink-0 rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-navy-950 shadow-lg shadow-gold-500/15' : isBar ? 'shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white' : 'shrink-0 rounded-full border border-navy-900/10 bg-white px-4 py-2 text-xs font-semibold text-navy-600 transition hover:border-gold-400 hover:text-navy-950'}>
              {category}
            </button>)}
          </div>
        </div>

        {filtered.length > 0 ? <div className={isBar ? 'mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {filtered.map((item, index) => <article key={item.id} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            className={isBar ? 'group relative overflow-hidden rounded-xl border border-white/10 bg-[#0e1624] p-5 transition duration-500 hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-[0_24px_60px_rgba(0,0,0,.35)] motion-fade-up' : 'group overflow-hidden rounded-xl border border-navy-900/10 bg-white shadow-[0_14px_40px_rgba(7,21,54,.06)] transition duration-500 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-[0_24px_60px_rgba(7,21,54,.12)] motion-fade-up'}>
            {item.image ? <div className="relative aspect-[4/3] overflow-hidden">
              <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white backdrop-blur-md">{item.category}</span>
            </div> : <div className="relative mb-5 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_35%,rgba(199,154,62,.2),transparent_34%),linear-gradient(145deg,#121d2e,#080d16)]">
              <div className="absolute h-24 w-24 rounded-full border border-gold-400/15" /><div className="absolute h-16 w-16 rounded-full border border-gold-400/20" />
              <Martini className="relative text-gold-300/80" size={30} strokeWidth={1.25} />
              <span className="absolute bottom-3 left-4 text-[9px] uppercase tracking-[.18em] text-white/35">{item.category}</span>
            </div>}
            <div className="p-5 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className={isBar ? 'font-display text-xl text-white' : 'font-display text-xl text-navy-950'}>{item.name}</h3>
                  <p className={isBar ? 'mt-1 text-[11px] uppercase tracking-[.12em] text-white/35' : 'mt-1 text-[11px] uppercase tracking-[.12em] text-navy-400'}>{item.category || 'House selection'}</p>
                </div>
                <span className={isBar ? 'font-display text-base text-gold-300' : 'font-display text-base text-gold-700'}>{naira(item.price)}</span>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className={item.available ? (isBar ? 'text-[11px] text-emerald-300/80' : 'text-[11px] text-emerald-700') : 'text-[11px] text-red-500'}>{item.available ? 'Available now' : 'Currently unavailable'}</span>
                <span className={isBar ? 'flex items-center gap-1 text-[10px] text-white/30' : 'flex items-center gap-1 text-[10px] text-navy-400'}>{isBar ? <Sparkles size={12} /> : <Utensils size={12} />}{isBar ? 'Annex Bar' : 'Annex dining'}</span>
              </div>
            </div>
          </article>)}
        </div> : <div className={isBar ? 'mt-12 rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-white/45' : 'mt-12 rounded-xl border border-navy-900/10 bg-white p-10 text-center text-sm text-navy-400'}>Nothing in this category yet. Check another category.</div>}
      </section>

      <section className={isBar ? 'border-t border-white/10 bg-[#05080e] px-5 py-16 text-center md:px-10' : 'border-t border-navy-900/10 bg-[#eee7dc] px-5 py-16 text-center md:px-10'}>
        <Flame className="mx-auto mb-4 text-gold-500" size={20} />
        <p className={isBar ? 'text-[10px] uppercase tracking-[.25em] text-white/35' : 'text-[10px] uppercase tracking-[.25em] text-navy-400'}>The Annex · Blue Pair Hotel</p>
        <h2 className={isBar ? 'mt-3 font-display text-3xl text-white' : 'mt-3 font-display text-3xl text-navy-950'}>Stay a little longer.</h2>
        <p className={isBar ? 'mx-auto mt-3 max-w-lg text-sm text-white/45' : 'mx-auto mt-3 max-w-lg text-sm text-navy-500'}>Good food, good drinks and a space worth settling into.</p>
      </section>
    </div>
  )
}
