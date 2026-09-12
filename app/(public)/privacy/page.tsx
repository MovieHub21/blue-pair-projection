import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '../../../lib/data'
import { SITE_EMAIL, SITE_NAME, SITE_PHONE_DISPLAY, SITE_URL, SITE_ADDRESS_DISPLAY } from '../../../lib/siteConfig'

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `Privacy Policy for ${SITE_NAME}, Uromi, Edo State. Learn how we collect, use, protect and retain guest information.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
}

export default async function PrivacyPolicyPage() {
  const content = await getSiteContent()
  const address = content.hotel_address || SITE_ADDRESS_DISPLAY
  const phone = content.hotel_phone || SITE_PHONE_DISPLAY
  const email = content.hotel_email || SITE_EMAIL

  return (
    <main className="min-h-screen bg-cream-50 text-navy-950">
      <section className="section pt-32">
        <div className="container-w max-w-4xl">
          <p className="eyebrow mb-3">Your privacy matters</p>
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-5 text-sm text-navy-700">Last updated: September 12, 2026</p>

          <div className="mt-10 space-y-8 text-[15px] leading-8 text-navy-800">
            <section className="glass-card p-6 md:p-8">
              <h2 className="text-2xl font-display font-semibold mb-3">1. Introduction</h2>
              <p>{SITE_NAME} respects your privacy. This policy explains what information we may collect when you visit our website, make a reservation, use guest services, contact us, or otherwise interact with our hotel and digital services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">2. Information we collect</h2>
              <p>Depending on how you use our services, we may collect information such as your name, email address, phone number, reservation details, room preferences, guest requests, payment status and communications with our team. When you use an account, we may also process authentication and account information.</p>
              <p className="mt-3">We may automatically receive technical information such as your browser, device type, approximate location, IP address, pages visited and basic usage information needed to operate, secure and improve the website.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">3. How we use information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and manage reservations, check-ins, check-outs and guest requests.</li>
                <li>Communicate booking confirmations, payment updates, service notifications and important reservation information.</li>
                <li>Provide customer support and respond to enquiries.</li>
                <li>Maintain the security, reliability and performance of our website and services.</li>
                <li>Improve our hospitality services, website experience and operational processes.</li>
                <li>Send promotional or marketing communications only where permitted and, where applicable, where you have opted in.</li>
                <li>Comply with applicable legal, regulatory, accounting and security obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">4. Payments</h2>
              <p>Payment information may be processed through authorised payment providers. We do not intend to store complete payment-card credentials on our own website systems when the payment provider handles that information. Payment processing remains subject to the provider&apos;s own terms and privacy practices.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">5. Cookies and similar technologies</h2>
              <p>We may use cookies or similar technologies to keep the website functioning, remember preferences, maintain sessions, understand website usage and improve performance. You can control cookies through your browser settings, although disabling some cookies may affect certain website features.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">6. Sharing information</h2>
              <p>We may share information with service providers that help us operate the hotel and website, such as hosting, database, payment, email, analytics, security and technical service providers. We may also disclose information where required by law, to protect our guests and business, or in connection with a legitimate operational need. We do not sell your personal information as a business model.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">7. Data security and retention</h2>
              <p>We use reasonable technical and organisational measures designed to protect personal information against unauthorised access, loss, misuse or disclosure. We retain information for as long as reasonably necessary for the purpose for which it was collected, to provide our services, resolve disputes, maintain business records and meet legal or regulatory requirements.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">8. Your choices and rights</h2>
              <p>Depending on applicable law, you may have rights to request access to, correction of, deletion of, or information about the processing of your personal information. You may also withdraw consent for optional marketing communications. Requests can be made using the contact details below; we may need to verify a request before acting on it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">9. Children&apos;s privacy</h2>
              <p>Our website is intended for general hospitality and booking use and is not designed to knowingly collect personal information directly from children without appropriate involvement of a parent, guardian or other responsible adult.</p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-3">10. Changes to this policy</h2>
              <p>We may update this Privacy Policy when our services, technology or legal obligations change. The updated version will be published on this page with a revised date.</p>
            </section>

            <section className="glass-blue rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-display font-semibold mb-3">11. Contact us</h2>
              <p>If you have a privacy question or request, contact Blue Pair Hotel:</p>
              <div className="mt-4 space-y-1">
                <p>{address}</p>
                <p>{phone}</p>
                <p>{email}</p>
              </div>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/terms" className="btn btn-gold">Terms &amp; Conditions</Link>
            <Link href="/" className="btn btn-outline">Back to hotel</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
