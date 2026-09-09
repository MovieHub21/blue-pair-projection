export interface BreadcrumbItem { name: string; path: string }

/** Renders one or more JSON-LD <script> blocks. Server component — no
 * client JS needed, and since it's part of the server-rendered HTML,
 * crawlers (including non-JS ones) see it immediately. */
export default function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((item, i) => (
        // eslint-disable-next-line react/no-danger
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
    </>
  )
}

export function breadcrumbJsonLd(items: BreadcrumbItem[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: `${siteUrl}${b.path}` })),
  }
}
