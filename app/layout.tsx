import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../lib/siteConfig'
import ToastHost from '../components/ui/Toast'
import RouteProgress from '../components/RouteProgress'
import GuestEmailWatcher from '../components/GuestEmailWatcher'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A1229' }

export const metadata: Metadata = {
  keywords: [
    'Blue Pair Hotel', 'hotel in Nigeria', 'hotel in Uromi', 'hotel in Edo State', 'luxury hotel Nigeria',
    'hotel with swimming pool in Nigeria', 'hotel with gym in Nigeria', 'hotel with pool and gym in Edo State',
    'hotel rooms and suites Nigeria', 'hotel booking Nigeria', 'hotel accommodation Nigeria',
    'hotel near Ekpoma', 'hotel near Auchi', 'hotel near Benin City', 'restaurant in Uromi', 'event venue Uromi', 'short-let Uromi',
  ],
  category: 'hotel',
  formatDetection: { telephone: true, address: true, email: true },
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Luxury Hotel in Uromi, Edo State`, template: `%s | ${SITE_NAME}` },
  description: "Blue Pair Hotel is a premium hotel in Uromi, Edo State, Nigeria, offering rooms and suites, an indoor swimming pool, fitness gym, dining, VIP lounge, events and short-let accommodation. Book online.",
  openGraph: { siteName: SITE_NAME, images: [{ url: DEFAULT_OG_IMAGE }], locale: 'en_NG', type: 'website' },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
