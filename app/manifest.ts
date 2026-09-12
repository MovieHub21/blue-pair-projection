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
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
