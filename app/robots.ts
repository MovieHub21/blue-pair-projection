import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/siteConfig'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account/',
        '/admin/',
        '/reception/',
        '/housekeeping/',
        '/maintenance/',
        '/api/',
        '/auth/',
        '/staff/',
        '/dev/',
        '/site-maintenance',
        '/booking*',
        '/*?*checkin=*',
        '/*?*checkout=*',
        '/*?*guests=*',
      ],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
