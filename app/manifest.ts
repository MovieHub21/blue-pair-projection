import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Blue Pair Signature Crown Hotel & Suites',
    short_name: 'Blue Pair',
    description: 'Blue Pair guest portal for bookings, messages, requests, invoices and hotel updates.',
    start_url: '/account/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#071536',
    theme_color: '#071536',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
}
