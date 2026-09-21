'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Search, X } from 'lucide-react'
import { naira } from '../../lib/format'

/**
 * The shared look of every food and drink menu on the site: the Dining page and the Annex Restaurant,
 * Grilling, Outdoor Eatery and Bar pages. It uses the brand colours (navy and gold on cream) and one
 * layout, so the menus feel like one hotel. The Annex Bar adds ordering through `renderAction`.
 */

export type MenuBrowserItem = { id: string; name: string; category: string; price: number; available: boolean; image?: string }
export type MenuNouns = { one: string; many: string }
export const DISH_NOUNS: MenuNouns = { one: 'dish', many: 'dishes' }
export const DRINK_NOUNS: MenuNouns = { one: 'drink', many: 'drinks' }

// Courses first, then everything else alphabetically, so a menu reads the way a meal is eaten.
const COURSE_ORDER = ['starters', 'small chops', 'soups & swallows', 'rice & pasta', 'grills & mains', 'grills', 'continental', 'desserts', 'cold drinks', 'drinks']
const courseRank = (category: string) => {
  const index = COURSE_ORDER.indexOf(category.trim().toLowerCase())
  return index === -1 ? COURSE_ORDER.length : index
}
export const cleanCategory = (item: { category?: string | null }) => item.category?.trim() || 'House selection'
export const countLabel = (count: number, nouns: MenuNouns = DISH_NOUNS) => `${count} ${count === 1 ? nouns.one : nouns.many}`
const hideBrokenImage = (event: React.SyntheticEvent<HTMLImageElement>) => { event.currentTarget.style.display = 'none' }

/* ---------------------------------------------------------------- Hero */

export function MenuHero({ eyebrow, kicker, title, description, image, overlap = false, actions, meta }: {
  eyebrow: string
  kicker?: string
  title: string
  description: string
  image?: string
  /** Leave room at the bottom for cards that overlap the hero (the Dining venue selector). */
  overlap?: boolean
  actions?: ReactNode
  meta?: string
}) {
  return (
    <div className="relative isolate overflow-hidden bg-navy-950 text-white">
      {image && <img src={image} alt="" fetchPriority="high" onError={hideBrokenImage} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,11,23,.92)_0%,rgba(6,11,23,.6)_55%,rgba(6,11,23,.25)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-navy-950 to-transparent" />
      <div className={'mx-auto max-w-7xl px-5 pt-16 md:px-10 md:pt-24 ' + (overlap ? 'pb-40 md:pb-48' : 'pb-16 md:pb-24')}>
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[.26em] text-gold-400">{eyebrow}</span>
          <span className="h-px w-12 bg-gold-400/70" />
          {kicker && <span className="hidden text-[11px] uppercase tracking-[.2em] text-white/50 sm:block">{kicker}</span>}
        </div>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.95] tracking-[-.03em] [text-wrap:balance] md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/80 md:text-base">{description}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#menu" className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-xs font-bold text-navy-950 transition hover:-translate-y-0.5 hover:bg-gold-300">
            See the menu <ArrowDown size={15} />
          </a>
          {actions}
          {meta && <span className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/70 backdrop-blur-md">{meta}</span>}
        </div>
      </div>
    </div>
  )
}

export const heroGhostButton = 'inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/15'

/* ------------------------------------------------------------- Closing */

export function MenuClosing({ eyebrow, title, description, actions, links, bottomInset = false }: {
  eyebrow?: string
  title: string
  description: string
  actions: Array<{ label: string; href: string; primary?: boolean }>
  links?: Array<{ label: string; href: string }>
  /** Extra space at the bottom when a fixed checkout bar sits over the page. */
  bottomInset?: boolean
}) {
  return (
    <div className={'border-t border-navy-900/10 bg-navy-950 px-5 pt-20 text-center text-white md:pt-24 ' + (bottomInset ? 'pb-36 md:pb-40' : 'pb-20 md:pb-24')}>
      <div className="mx-auto mb-8 h-px w-16 bg-gold-400" />
      {eyebrow && <p className="mb-4 text-[10px] uppercase tracking-[.3em] text-white/45">{eyebrow}</p>}
      <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight tracking-[-.02em] md:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-white/65 md:text-base">{description}</p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        {actions.map(action => action.primary
          ? <Link key={action.href} href={action.href} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-xs font-bold text-navy-950 transition hover:-translate-y-0.5 hover:bg-gold-300">{action.label} <ArrowRight size={15} /></Link>
          : <Link key={action.href} href={action.href} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-xs font-semibold text-white transition hover:bg-white/10">{action.label}</Link>)}
      </div>
      {links && links.length > 0 && (
        <nav aria-label="More places to eat and drink" className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-semibold uppercase tracking-[.18em] text-gold-400">
          {links.map(link => <Link key={link.href} href={link.href} className="transition hover:text-gold-300">{link.label}</Link>)}
        </nav>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- Search */

function SearchBox({ label, query, onChange, className = '' }: { label: string; query: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={'relative block ' + className}>
      <span className="sr-only">Search {label}</span>
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-900/40" />
      <input
        type="search"
        value={query}
        onChange={event => onChange(event.target.value)}
        placeholder="Search"
        className="h-10 w-full rounded-full border border-navy-900/10 bg-white pl-10 pr-9 text-sm outline-none transition placeholder:text-navy-900/40 focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {query.trim().length > 0 && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-navy-900/60 hover:bg-navy-900/5">
          <X size={14} />
        </button>
      )}
    </label>
  )
}

/* -------------------------------------------------------- The menu itself */

export function MenuBrowser<T extends MenuBrowserItem>({ items, nouns = DISH_NOUNS, label, renderAction, note, emptyTitle }: {
  items: T[]
  nouns?: MenuNouns
  /** Name of the place, used for the search label and the empty message. */
  label: string
  /** Optional control shown on each available item (the Annex Bar uses it for "Add" and the quantity stepper). */
  renderAction?: (item: T) => ReactNode
  note?: string
  emptyTitle?: string
}) {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach(item => counts.set(cleanCategory(item), (counts.get(cleanCategory(item)) ?? 0) + 1))
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => courseRank(a.name) - courseRank(b.name) || a.name.localeCompare(b.name))
  }, [items])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const visible = items.filter(item => (category === 'All' || cleanCategory(item) === category) && (!term || item.name.toLowerCase().includes(term)))
    return categories
      .map(({ name }) => ({
        name,
        // Items that can be ordered come first; unavailable ones stay listed but at the end.
        items: visible.filter(item => cleanCategory(item) === name).sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name)),
      }))
      .filter(group => group.items.length > 0)
  }, [items, categories, category, query])

  const resultCount = groups.reduce((sum, group) => sum + group.items.length, 0)

  // One photographed item per course first, so the featured row shows variety.
  const featured = useMemo(() => {
    const withPhoto = items.filter(item => item.image && item.available)
    const picked: T[] = []
    const seen = new Set<string>()
    for (const item of withPhoto) if (picked.length < 3 && !seen.has(cleanCategory(item))) { picked.push(item); seen.add(cleanCategory(item)) }
    for (const item of withPhoto) if (picked.length < 3 && !picked.includes(item)) picked.push(item)
    return picked
  }, [items])

  return (
    <>
      {items.length > 0 && (
        <div className="mx-auto mt-8 max-w-7xl px-5 md:hidden">
          <SearchBox label={label} query={query} onChange={setQuery} />
        </div>
      )}

      {/* Sticky course and search bar */}
      <div id="menu" className={'z-30 mt-6 md:mt-16 ' + (items.length > 0 ? 'sticky top-[72px] border-y border-navy-900/10 bg-cream-50/95 backdrop-blur-md' : '')}>
        {items.length > 0 && (
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:gap-6 md:px-10">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Menu sections">
              {[{ name: 'All', count: items.length }, ...categories].map(option => {
                const active = category === option.name
                return (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(option.name)}
                    className={'shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ' + (active ? 'bg-navy-900 text-white' : 'border border-navy-900/10 bg-white text-navy-900/70 hover:border-gold-500 hover:text-navy-900')}
                  >
                    {option.name}
                    <span className={'ml-1.5 text-[10px] font-medium ' + (active ? 'text-white/60' : 'text-navy-900/40')}>{option.count}</span>
                  </button>
                )
              })}
            </div>
            <SearchBox label={label} query={query} onChange={setQuery} className="hidden md:block md:w-64" />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 md:px-10 md:pb-28 md:pt-16">
        <p role="status" className="sr-only">{searching ? `${countLabel(resultCount, nouns)} found` : ''}</p>

        {/* Featured: only when photographs exist */}
        {featured.length > 0 && category === 'All' && !searching && (
          <div className="mb-16 md:mb-20">
            <div className="mb-7">
              <span className="text-[11px] font-semibold uppercase tracking-[.26em] text-gold-600">Featured</span>
              <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">From the {nouns.many === 'drinks' ? 'bar' : 'kitchen'}</h2>
            </div>
            <ul className={'-mx-5 flex scroll-pl-5 snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0 ' + (featured.length === 1 ? '' : featured.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
              {featured.map(item => (
                <li key={item.id} className={'group relative aspect-[4/5] w-[76%] shrink-0 snap-start overflow-hidden rounded-xl bg-navy-900 sm:w-[46%] md:w-auto ' + (featured.length === 3 ? '' : featured.length === 2 ? 'md:aspect-[4/3]' : 'md:aspect-[21/9]')}>
                  <img src={item.image} alt={item.name} loading="lazy" decoding="async" onError={hideBrokenImage} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                    <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold-400">{cleanCategory(item)}</span>
                    <div className="mt-1.5 flex items-end justify-between gap-4">
                      <h3 className="font-display text-xl leading-snug text-white md:text-2xl">{item.name}</h3>
                      <span className="shrink-0 font-display text-base text-gold-300 tabular-nums">{naira(item.price)}</span>
                    </div>
                    {renderAction && <div className="mt-4 flex justify-end">{renderAction(item)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* One section at a time */}
        {groups.length > 0 ? (
          <div className="space-y-14 md:space-y-16">
            {groups.map(group => (
              <section key={group.name} aria-labelledby={`menu-section-${group.name}`} className="before:!hidden">
                <div className="mb-3 flex items-baseline gap-4 md:mb-4">
                  <h2 id={`menu-section-${group.name}`} className="font-display text-3xl leading-none md:text-4xl">{group.name}</h2>
                  <span className="h-px flex-1 bg-gold-500/40" />
                  <span className="text-[11px] font-medium uppercase tracking-[.18em] text-navy-900/40">{countLabel(group.items.length, nouns)}</span>
                </div>
                <ul className="grid gap-x-16 md:grid-cols-2">
                  {group.items.map(item => (
                    <li key={item.id} className={'flex items-center gap-4 border-b border-navy-900/[.08] py-4 ' + (item.available ? '' : 'opacity-55')}>
                      {item.image && <img src={item.image} alt="" loading="lazy" decoding="async" width={72} height={72} onError={hideBrokenImage} className="h-16 w-16 shrink-0 rounded-lg object-cover md:h-[72px] md:w-[72px]" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3">
                          <h3 className="font-display text-[19px] leading-snug md:text-[21px]">{item.name}</h3>
                          <span aria-hidden className="mb-1.5 hidden min-w-6 flex-1 self-end border-b border-dotted border-navy-900/25 sm:block" />
                          <span className="ml-auto whitespace-nowrap font-display text-[17px] text-gold-600 tabular-nums sm:ml-0">{naira(item.price)}</span>
                        </div>
                        {!item.available && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-red-700/80">Currently unavailable</p>}
                      </div>
                      {renderAction && item.available && <div className="shrink-0">{renderAction(item)}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-navy-900/15 bg-white/60 px-6 py-16 text-center">
            <h2 className="font-display text-2xl">{searching ? `Nothing matches “${query.trim()}”` : (emptyTitle || `The ${label} menu is being updated`)}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-navy-900/60">
              {searching ? 'Try a different word, or clear the search to see the whole menu.' : 'Please check back soon, or contact us and we will gladly help.'}
            </p>
            {searching && <button type="button" onClick={() => setQuery('')} className="mt-6 rounded-full bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white">Clear search</button>}
          </div>
        )}

        {note && <p className="mt-12 text-xs leading-6 text-navy-900/50">{note}</p>}
      </div>
    </>
  )
}
