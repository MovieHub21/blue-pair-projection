import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '../../../lib/data'
import { SITE_EMAIL, SITE_NAME, SITE_PHONE_DISPLAY, SITE_URL, SITE_ADDRESS_DISPLAY } from '../../../lib/siteConfig'

export const metadata: Metadata = {
  title: `Terms & Conditions | ${SITE_NAME}`,
  description: `Terms and Conditions for bookings, stays and use of the ${SITE_NAME} website in Uromi, Edo State.`,
  alternates: { canonical: `${SITE_URL}/terms` },
}

export default async function TermsPage() {
  const content = await getSiteContent()
  const address = content.hotel_address || SITE_ADDRESS_DISPLAY
  const phone = content.hotel_phone || SITE_PHONE_DISPLAY
  const email = content.hotel_email || SITE_EMAIL

  return (
    <main className="min-h-screen bg-cream-50 text-navy-950">
      <section className="section pt-32">
        <div className="container-w max-w-4xl">
          <p className="eyebrow mb-3">Important information</p>
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-5 text-sm text-navy-700">Last updated: September 12, 2026</p>

          <div className="mt-10 space-y-8 text-[15px] leading-8 text-navy-800">
            <section className="glass-card p-6 md:p-8">
              <h2 className="text-2xl font-display font-semibold mb-3">1. Acceptance of these terms</h2>
              <p>By using the {SITE_NAME} website, creating an account, making a reservation or using our hotel services, you agree to these Terms &amp; Conditions and any specific conditions communicated for your booking, event or service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">2. Reservations</h2>
              <p>Reservations are subject to availability and are confirmed only when the booking process has been successfully completed and any required payment or confirmation conditions have been satisfied. Information shown on the website, including room descriptions, amenities, prices and availability, may change without notice.</p>
              <p className="mt-3">Guests should provide accurate contact and reservation information. A booking may be cancelled or declined where information is materially inaccurate, fraudulent or inconsistent with the applicable booking conditions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">3. Rates and payment</h2>
              <p>Prices displayed on the website are subject to change and may be subject to applicable taxes, charges, deposits or service fees. The amount due and accepted payment methods will be communicated during the booking or payment process. Where a third-party payment provider is used, its terms may also apply.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">4. Check-in and check-out</h2>
              <p>Guests must comply with the hotel&apos;s check-in and check-out times and provide any information reasonably required for registration. Early check-in or late check-out may depend on availability and may attract an additional charge.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">5. Cancellations and modifications</h2>
              <p>Cancellation, modification, refund and no-show conditions may vary by room, rate, offer, event or booking. The conditions applicable to your reservation are the conditions presented or communicated for that reservation. Where a refund is approved, processing time may depend on the payment method or payment provider.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">6. Guest conduct</h2>
              <p>Guests are expected to respect other guests, staff, hotel property and applicable laws. Illegal activity, abusive behaviour, deliberate property damage, unauthorised use of facilities, or conduct that materially disrupts hotel operations may result in removal from the premises, cancellation of services or other appropriate action.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">7. Hotel facilities and events</h2>
              <p>Access to facilities such as the pool, gym, club, restaurant, bar, lounges, event spaces and other amenities may be subject to opening hours, capacity limits, age requirements, safety rules, private events or temporary closure. Specific facility rules communicated on site must be followed.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">8. Property and personal belongings</h2>
              <p>Guests should take reasonable care of their belongings and hotel property. Guests may be responsible for loss or damage caused by their actions or by people under their responsibility, subject to applicable law and any specific hotel policy.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">9. Website use</h2>
              <p>You may use this website for lawful personal or legitimate business purposes. You must not attempt to interfere with the website, bypass security controls, introduce malicious code, scrape protected information, impersonate another person, or use the website for fraudulent or unlawful activity.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">10. Website information</h2>
              <p>We aim to keep website information accurate and current, but we do not guarantee that every description, image, price, availability indicator or other content will always be complete, current or error-free. We may correct errors and update content without prior notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">11. Third-party services</h2>
              <p>The website may rely on third-party services for payments, hosting, maps, email, analytics or other functionality. Your use of a third-party service may be subject to that provider&apos;s separate terms and policies.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">12. Changes to these terms</h2>
              <p>We may update these Terms &amp; Conditions as our services, website or legal obligations change. The current version will be published on this page. Terms specifically provided with an existing booking may continue to apply to that booking.</p>
            </section>

            <section className="glass-blue rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-display font-semibold mb-3">13. Contact</h2>
              <p>For questions about a reservation, these terms or our hotel services, contact Blue Pair Hotel:</p>
              <div className="mt-4 space-y-1">
                <p>{address}</p>
                <p>{phone}</p>
                <p>{email}</p>
              </div>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/privacy" className="btn btn-gold">Privacy Policy</Link>
            <Link href="/" className="btn btn-outline">Back to hotel</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
