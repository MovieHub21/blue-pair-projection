import { ReactNode } from 'react'
import PageHero from '../layout/PageHero'
import SectionHeading from './SectionHeading'
import JsonLd, { breadcrumbJsonLd, BreadcrumbItem } from '../JsonLd'
import { SITE_URL } from '../../lib/siteConfig'
import { Clock, MapPin, CheckCircle2 } from 'lucide-react'
import AmenityCarousel from '../../components/ui/AmenityCarousel'

export interface AmenityConfig {
  name: string
  eyebrow: string
  mini: string
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
    {config.breadcrumbs && (
      <JsonLd data={breadcrumbJsonLd(config.breadcrumbs, SITE_URL)} />
    )}

    <PageHero
      image={config.heroImage}
      eyebrow={config.eyebrow}
      title={config.name}
      crumbs={`Home / ${config.name}`}
    />

    {/* Amenity Main Area */}
    <section className="section">
      <div className="container-w">

       

        {/* Main Two Column Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Information */}
          <div>
             {/* Intro / Title */}
        <div className=" max-w-3xl mx-auto mb-14">
          <span className="eyebrow">
            {config.mini || 'AN EXPERIENCE FOR THE SENSES'}
          </span>

          <h2 className="text-4xl md:text-5xl font-display mt-3">
            The {config.name}
          </h2>
        </div>

            <p className="text-navy-600 leading-8 text-[15px] max-w-xl">
              {config.description}
            </p>

            {/* Hours */}
            <div className="mt-10">
              <h4 className="text-lg font-semibold text-navy-900 mb-4">
                Hours
              </h4>

              <div className="flex items-center gap-3 text-sm text-navy-600">
                <span className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                  <Clock
                    size={18}
                    className="text-gold-500"
                  />
                </span>

                <div>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-navy-400 block mb-1">
                    Time
                  </span>

                  <span>
                    {config.hours}
                  </span>
                </div>
              </div>
            </div>

           

            
            {/* Existing extra content */}
            {config.extra}
          </div>

          {/* RIGHT — Image Carousel */}
          <AmenityCarousel
  images={config.gallery}
  name={config.name}
/>
               
        </div>

        {/* Facilities */}
        {config.facilities?.length > 0 && (
          <div className="mt-16 pt-12 border-t border-black/5">
            <h4 className="text-lg font-semibold mb-5">
              Facilities &amp; services
            </h4>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.facilities.map(f => (
                <div
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-navy-700"
                >
                  <CheckCircle2
                    size={16}
                    className="text-gold-500 shrink-0"
                  />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest Access Note */}
        <p className="text-[11px] text-navy-400 text-center mt-10">
          Guests staying at Blue Pair Hotel enjoy priority access.
        </p>

      </div>
    </section>
  </div>
)
}
