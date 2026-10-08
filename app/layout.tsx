import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../lib/siteConfig'
import RouteProgress from '../components/RouteProgress'
import GuestEmailWatcher from '../components/GuestEmailWatcher'
import RealtimeBridge from '../components/RealtimeBridge'
import ActionLoading from '../components/ui/ActionLoading'
import BackgroundJobNotifications from '../components/ui/BackgroundJobNotifications'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A1229' }

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  category: 'hotel',
  formatDetection: { telephone: true, address: true, email: true },
  metadataBase: new URL(SITE_URL),
  title: { default: 'Hotels in Uromi | Blue Pair Signature', template: '%s | Blue Pair Hotel' },
  description: 'Blue Pair Signature Crown Hotel & Suites is a premium hotel in Uromi, Edo State, Nigeria, offering rooms and suites, an indoor swimming pool, fitness gym, dining, VIP lounge, events and short-let accommodation. Book your stay online.',
  openGraph: {
    siteName: SITE_NAME,
    title: 'Hotels in Uromi | Blue Pair Signature',
    description: 'Premium rooms, suites, dining, leisure, events and guest services in Uromi, Edo State, Nigeria.',
    images: [{ url: DEFAULT_OG_IMAGE }],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Hotels in Uromi | Blue Pair Hotel', description: 'Premium hotel accommodation, dining, leisure, events and guest services in Uromi, Edo State, Nigeria.' },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
  },
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
        <RealtimeBridge />
        <ActionLoading />
        <BackgroundJobNotifications />
        {children}
      </body>
    </html>
  )
}
