import Link from 'next/link'
import { SITE_ADDRESS_DISPLAY, SITE_PHONE_DISPLAY, SITE_EMAIL } from '../../lib/siteConfig'
import SocialLinks from './SocialLinks'
import { ExternalLink, MapPin } from 'lucide-react'

export default function PublicFooter({ content = {} }: { content?: Record<string, string> }) {
  const address = content.hotel_address || SITE_ADDRESS_DISPLAY
  const phone = content.hotel_phone || SITE_PHONE_DISPLAY
  const email = content.hotel_email || SITE_EMAIL
  const note = content.footer_note || "Uromi's premium address for stays, dining and events — where luxury hospitality meets Edo State warmth."
  const mapQuery = encodeURIComponent(address)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`

  return (
    <footer className="bg-navy-950 text-white/70 pt-20 pb-8">
      <div className="container-w px-6 md:px-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 font-display text-xl font-semibold text-white mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />Blue Pair Signature Crown Hotel &amp; Suites</div>
            <p className="text-sm leading-relaxed max-w-xs">{note}</p>
            <SocialLinks content={content} className="mt-5" />
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Explore</h5>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/rooms" className="hover:text-white">Rooms &amp; Suites</Link>
              <Link href="/dining" className="hover:text-white">Dining</Link>
              <Link href="/annex" className="hover:text-white">The Annex</Link>
              <Link href="/events" className="hover:text-white">Events</Link>
              <Link href="/offers" className="hover:text-white">Offers</Link>
            </div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Guest</h5>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/account/bookings" className="hover:text-white">Manage booking</Link>
              <Link href="/booking" className="hover:text-white">Book a room</Link>
              <Link href="/billboard" className="hover:text-white">Advertising</Link>
             
            </div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Contact</h5>
            <div className="flex flex-col gap-2.5 text-sm"><span>{address}</span>
            <a href={`tel:${phone}`} className="hover:text-white">{phone}</a></div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Reservation</h5>
            <div className="flex flex-col gap-2.5 text-sm">
           <a href={`mailto:bookings@bluepairsignature.com`} className="hover:text-white">bookings@bluepairsignature.com</a></div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">partnership</h5>
            <div className="flex flex-col gap-2.5 text-sm">
            <a href={`mailto:partnership@bluepairsignature.com`} className="hover:text-white">partnership@bluepairsignature.com</a></div>
          </div>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] sm:flex sm:items-stretch">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4 p-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-300"><MapPin size={18} /></span>
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-gold-300">Find us</p><p className="mt-1 truncate text-sm text-white/65">{address}</p></div>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-gold-400 hover:text-gold-300">Open map <ExternalLink size={13} /></a>
          </div>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Blue Pair Signature location in Google Maps" className="relative block h-36 border-t border-white/10 sm:h-auto sm:min-h-[132px] sm:w-64 sm:shrink-0 sm:border-l sm:border-t-0">
            <iframe title="Blue Pair Signature location map" src={mapEmbedUrl} className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-90" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </a>
        </div>
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3 text-xs text-white/40">
          <span>
  © {new Date().getFullYear()} Blue Pair Signature Crown Hotel &amp; Suites. All rights reserved.
</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">·</span><Link href="/terms" className="hover:text-white/80 transition-colors">Terms &amp; Conditions</Link>
            </div>
        </div>
      </div>
    </footer>
  )
}
