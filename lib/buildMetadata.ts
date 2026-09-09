import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from './siteConfig'

interface Params {
  title: string
  description: string
  path: string
  keywords?: string
  image?: string
  noindex?: boolean
}

/** One consistent shape for every page's <head> — title, description,
 * keywords, canonical, robots, Open Graph and Twitter Card. Used via the
 * `metadata` (static) or `generateMetadata` (dynamic routes) export in
 * every page.tsx — this is what Next.js renders server-side into the raw
 * HTML `<head>`, so it's there before any JavaScript runs.
 *
 * The root layout defines a title template ("%s | Blue Pair Hotel"), so
 * page titles here are passed as plain strings WITHOUT the brand name —
 * Next appends it automatically. Titles that already stand on their own
 * (e.g. the homepage) opt out of the template via `title.absolute`. */
export function buildMetadata({ title, description, path, keywords, image, noindex }: Params): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE
  const alreadyBranded = title.includes(SITE_NAME)
  return {
    title: alreadyBranded ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: alreadyBranded ? title : `${title} | ${SITE_NAME}`, description, url, siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'en_NG', type: 'website',
    },
    twitter: { card: 'summary_large_image', title: alreadyBranded ? title : `${title} | ${SITE_NAME}`, description, images: [ogImage] },
  }
}
