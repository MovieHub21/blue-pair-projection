import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../lib/siteConfig'
import PrototypeSwitcher from '../components/PrototypeSwitcher'
import ToastHost from '../components/ui/Toast'

export const viewport: Viewport = { themeColor: '#0A1229' }

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Luxury Hotel in Uromi, Edo State`, template: `%s | ${SITE_NAME}` },
  description: "Blue Pair Hotel — Uromi's premier luxury hotel in Edo State. Rooms & suites, fine dining, an indoor pool, gym, VIP lounge and events. Book online.",
  openGraph: { siteName: SITE_NAME, images: [{ url: DEFAULT_OG_IMAGE }], locale: 'en_NG', type: 'website' },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <PrototypeSwitcher />
        <ToastHost />
      </body>
    </html>
  )
}
