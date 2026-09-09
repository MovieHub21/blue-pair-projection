import { ReactNode } from 'react'
import PageHero from '../layout/PageHero'
import SectionHeading from './SectionHeading'
import JsonLd, { breadcrumbJsonLd, BreadcrumbItem } from '../JsonLd'
import { SITE_URL } from '../../lib/siteConfig'
import { Clock, CheckCircle2 } from 'lucide-react'

export interface AmenityConfig {
  name: string
  eyebrow: string
  heroImage: string
  description: string
  gallery: string[]
  hours: string
  facilities: string[]
  pricingNote?: string
  ctaLabel?: string
  extra?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export default function AmenityPage({ config }: { config: AmenityConfig }) {
  return (
    <div>
      {config.breadcrumbs && <JsonLd data={breadcrumbJsonLd(config.breadcrumbs, SITE_URL)} />}
      <PageHero image={config.heroImage} eyebrow={config.eyebrow} title={config.name} crumbs={`Home / ${config.name}`} />
      <section className="section">
        <div className="container-w grid lg:grid-cols-[1.5fr,1fr] gap-14">
          <div>
            <SectionHeading eyebrow="About" title={`The ${config.name} experience`} subtitle={config.description} />
            <div className="grid grid-cols-2 gap-3 mb-10">
              {config.gallery.map((g, i) => (
                <div key={i} className={'rounded-xl2 overflow-hidden h-44 ' + (i === 0 ? 'col-span-2 h-64' : '')}>
                  <img src={g} alt={`${config.name} at Blue Pair Hotel, Uromi`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <h4 className="text-lg font-semibold mb-4">Facilities &amp; services</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {config.facilities.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-navy-700"><CheckCircle2 size={16} className="text-gold-500" />{f}</div>
              ))}
            </div>
            {config.extra}
          </div>
          <aside className="card p-6 h-fit sticky top-24">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900 mb-1"><Clock size={16} className="text-gold-500" /> Opening hours</div>
            <p className="text-sm text-navy-500 mb-6">{config.hours}</p>
            {config.pricingNote && (
              <>
                <div className="text-sm font-semibold text-navy-900 mb-1">Pricing</div>
                <p className="text-sm text-navy-500 mb-6">{config.pricingNote}</p>
              </>
            )}
            <button className="btn-gold w-full justify-center">{config.ctaLabel ?? 'Reserve now'}</button>
            <p className="text-[11px] text-navy-400 text-center mt-3">Guests staying at Blue Pair Hotel enjoy priority access.</p>
          </aside>
        </div>
      </section>
    </div>
  )
}
