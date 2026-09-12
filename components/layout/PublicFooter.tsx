import Link from 'next/link'
import { SITE_ADDRESS_DISPLAY, SITE_PHONE_DISPLAY, SITE_EMAIL } from '../../lib/siteConfig'
import SocialLinks from './SocialLinks'

export default function PublicFooter({ content = {} }: { content?: Record<string, string> }) {
  const address = content.hotel_address || SITE_ADDRESS_DISPLAY
  const phone = content.hotel_phone || SITE_PHONE_DISPLAY
  const email = content.hotel_email || SITE_EMAIL
  const note = content.footer_note || "Uromi's premium address for stays, dining and events — where luxury hospitality meets Edo State warmth."

  return (
    <footer className="bg-navy-950 text-white/70 pt-20 pb-8">
      <div className="container-w px-6 md:px-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 font-display text-xl font-semibold text-white mb-4"><span className="w-2.5 h-2.5 rounded-full bg-gold-500" />Blue Pair Hotel</div>
            <p className="text-sm leading-relaxed max-w-xs">{note}</p>
            <SocialLinks content={content} className="mt-5" />
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Explore</h5>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/rooms" className="hover:text-white">Rooms &amp; Suites</Link><Link href="/dining" className="hover:text-white">Dining</Link><Link href="/annex" className="hover:text-white">The Annex</Link><Link href="/events" className="hover:text-white">Events</Link><Link href="/offers" className="hover:text-white">Offers</Link>
            </div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Guest</h5>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/account/login" className="hover:text-white">Manage booking</Link><Link href="/booking" className="hover:text-white">Book a room</Link><Link href="/billboard" className="hover:text-white">Advertising</Link><Link href="/parking" className="hover:text-white">Parking</Link>
            </div>
          </div>
          <div>
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Contact</h5>
            <div className="flex flex-col gap-2.5 text-sm"><span>{address}</span><a href={`tel:${phone}`} className="hover:text-white">{phone}</a><a href={`mailto:${email}`} className="hover:text-white">{email}</a></div>
          </div>
        </div>
        <div className="mt-16 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3 text-xs text-white/40">
          <span>© 2026 Blue Pair Hotel. All rights reserved.</span>
          <div className="flex items-center gap-4"><Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link><span aria-hidden="true">·</span><Link href="/terms" className="hover:text-white/80 transition-colors">Terms &amp; Conditions</Link></div>
        </div>
      </div>
    </footer>
  )
}
