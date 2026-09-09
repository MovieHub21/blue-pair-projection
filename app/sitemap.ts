import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/siteConfig'
import { roomTypes, shortLets } from '../data/mock'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes: { path: string; priority: number }[] = [
    { path: '/', priority: 1.0 },
    { path: '/about', priority: 0.7 },
    { path: '/rooms', priority: 0.9 },
    { path: '/booking', priority: 0.6 },
    { path: '/dining', priority: 0.8 },
    { path: '/vip-lounge', priority: 0.6 },
    { path: '/gym', priority: 0.6 },
    { path: '/pool', priority: 0.6 },
    { path: '/games', priority: 0.5 },
    { path: '/club', priority: 0.6 },
    { path: '/smoking-area', priority: 0.3 },
    { path: '/billboard', priority: 0.4 },
    { path: '/parking', priority: 0.4 },
    { path: '/annex', priority: 0.7 },
    { path: '/annex/outdoor-eatery', priority: 0.6 },
    { path: '/annex/grilling', priority: 0.6 },
    { path: '/annex/bar', priority: 0.6 },
    { path: '/annex/vip-lounge', priority: 0.5 },
    { path: '/annex/restaurant', priority: 0.6 },
    { path: '/annex/shortlets', priority: 0.7 },
    { path: '/events', priority: 0.7 },
    { path: '/offers', priority: 0.7 },
    { path: '/gallery', priority: 0.5 },
    { path: '/contact', priority: 0.6 },
  ]

  const roomRoutes = roomTypes.map(r => ({ path: `/rooms/${r.slug}`, priority: 0.8 }))
  const shortletRoutes = shortLets.map(s => ({ path: `/annex/shortlets/${s.id}`, priority: 0.6 }))

  return [...staticRoutes, ...roomRoutes, ...shortletRoutes].map(r => ({
    url: `${SITE_URL}${r.path}`, lastModified: now, priority: r.priority,
  }))
}
