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

const SEO_BRAND = 'Blue Pair Hotel'

const HOTEL_SEARCH_CONTEXT = [
  'hotels in uromi',
  'hotels in uromi edo state',
  'best hotel in uromi',
  'best hotel in uromi edo state',
  'best hotels in uromi',
  'biggest hotel in uromi nigeria',
  'cheap hotels in uromi',
  'hotel in uromi',
  'hotels in uromi edo state nigeria',
  'hotels in uromi nigeria',
  'hotel in Nigeria',
  'hotel in Edo State',
  'hotel in Uromi',
  'hotel with swimming pool in Nigeria',
  'hotel with gym in Nigeria',
  'hotel with pool and gym in Edo State',
  'luxury hotel Nigeria',
  'hotel accommodation Nigeria',
  'hotel rooms and suites Nigeria',
  'hotel booking Nigeria',
  'hotel near Ekpoma',
  'hotel near Auchi',
  'hotel near Benin City',
]

function optimizeTitle(title: string) {
  let clean = title
    .replaceAll(SITE_NAME, SEO_BRAND)
    .replace(/\s+/g, ' ')
    .trim()

  // Keep the useful search intent before the old brand/suffix.
  let base = clean.split('|')[0].trim()

  // Dynamic room/short-let titles previously included prices, which make
  // titles longer without adding durable search intent.
  base = base.replace(/\s*[—–-]\s*₦[\d,]+(?:\.\d+)?\s*\/\s*night/gi, '')
  base = base.replace(/\s*[—–-]\s*Short-let in Uromi, Edo State/gi, ' in Uromi')

  // Prefer the concise location phrase when a title is still long.
  if (base.length > 48) base = base.replace(', Edo State', '')
  if (base.length > 48) base = base.replace(' in Uromi, Edo State', ' in Uromi')

  let result = base ? `${base} | ${SEO_BRAND}` : SEO_BRAND

  // Final guard for unusually long database-driven names.
  if (result.length > 65) {
    const maxBaseLength = 65 - SEO_BRAND.length - 3
    result = `${base.slice(0, maxBaseLength).trimEnd()}… | ${SEO_BRAND}`
  }

  return result
}

export function buildMetadata({ title, description, path, keywords, image, noindex }: Params): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE
  const seoTitle = optimizeTitle(title)
  const keywordSet = new Set([
    ...HOTEL_SEARCH_CONTEXT,
    ...(keywords ? keywords.split(',').map(value => value.trim()).filter(Boolean) : []),
  ])

  return {
    // Explicit page titles are absolute so the long legal company name in the
    // root title template cannot be appended to every public page.
    title: { absolute: seoTitle },
    description,
    keywords: Array.from(keywordSet),
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: seoTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: [ogImage],
    },
  }
}
