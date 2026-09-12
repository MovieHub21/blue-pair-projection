import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../lib/siteConfig'
import ToastHost from '../components/ui/Toast'
import RouteProgress from '../components/RouteProgress'
import GuestEmailWatcher from '../components/GuestEmailWatcher'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A1229' }

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  keywords: [
    'Blue Pair Signature Crown Hotel & Suites', 'Blue Pair Signature Crown', 'hotel in Nigeria', 'hotel in Uromi', 'hotel in Edo State', 'luxury hotel Nigeria',
    'hotel with swimming pool in Nigeria', 'hotel with gym in Nigeria', 'hotel with pool and gym in Edo State',
    'hotel rooms and suites Nigeria', 'hotel booking Nigeria', 'hotel accommodation Nigeria',
    'hotel near Ekpoma', 'hotel near Auchi', 'hotel near Benin City', 'restaurant in Uromi', 'event venue Uromi', 'short-let Uromi',
  ],
  category: 'hotel',
  formatDetection: { telephone: true, address: true, email: true },
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Luxury Hotel in Uromi, Edo State`, template: `%s | ${SITE_NAME}` },
  description: 'Blue Pair Signature Crown Hotel & Suites is a premium hotel in Uromi, Edo State, Nigeria, offering rooms and suites, an indoor swimming pool, fitness gym, dining, VIP lounge, events and short-let accommodation. Book your stay online.',
  openGraph: {
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Luxury Hotel in Uromi, Edo State`,
    description: 'Premium rooms, suites, dining, leisure, events and guest services in Uromi, Edo State, Nigeria.',
    images: [{ url: DEFAULT_OG_IMAGE }],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: 'Premium hotel accommodation, dining, leisure and events in Uromi, Edo State, Nigeria.' },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Blue Pair" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Suspense fallback={null}><RouteProgress /></Suspense>
        <GuestEmailWatcher />
        {children}
        <ToastHost />
      </body>
    </html>
  )
}
