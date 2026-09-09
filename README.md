# Blue Pair Hotel — Next.js (Uromi, Edo State)

Server-rendered rebuild of the Blue Pair Hotel prototype, on Next.js 14
(App Router). Same design, same components, same interactive prototype
flows as the Vite version — the difference is *where* the HTML gets built.

## Why this version exists

The Vite build was a pure client-side SPA: the server sent an almost-empty
`index.html` and the browser had to run JavaScript to render anything.
Google can usually handle that, but it's slower and less reliable, and
other crawlers/link-preview bots don't execute JS at all. This version
renders full HTML — real content, real `<title>`, real meta tags, real
JSON-LD — **on the server**, before anything reaches the browser. Verified:
`npm run build` produces 82 fully pre-rendered routes.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm run start
```

## What changed for this location

Every address, phone display, and location reference across the site now
points at **Uromi, Edo State** instead of Lagos:

- `lib/siteConfig.ts` — the single source of truth: address, phone, email,
  geo-coordinates (6.70°N, 6.33°E — Esan North-East LGA), and the list of
  nearby towns (Ekpoma, Auchi, Ubiaja, Benin City) used in copy and keywords.
- Every page's title/description/keywords targets Uromi- and Edo
  State-specific search intent — see "SEO strategy" below.
- The Hotel's site-wide JSON-LD (`app/(public)/layout.tsx`) carries the
  Uromi address and coordinates, and an `areaServed` list covering the
  surrounding towns.

**Before launch:** update `SITE_URL` and the address fields in
`lib/siteConfig.ts` with your final domain and confirmed business details —
every canonical URL, sitemap entry, and structured-data address derives
from that one file.

## SEO strategy — ranking for "hotel in Uromi" AND "hotel in Edo State"

Every page's `keywords` and body copy deliberately include **both** the
city-level term (Uromi) and the state-level term (Edo State), plus nearby
towns where relevant (Ekpoma, Auchi, Ubiaja) — not just one or the other.
That's what lets the same page have a shot at "hotel in Uromi", "hotel in
Edo State", and "hotel near Ekpoma" simultaneously, rather than picking one.

Amenity pages go further and combine "what" with "where" — `/gym` targets
"hotel gym uromi" AND "gym near me uromi" AND "hotel with gym esan
north-east"; `/pool` targets "hotel with pool" variants; `/club` targets
"nightclub uromi" / "club edo state". This is what makes the site surface
for "hotel with a gym near me" style searches, not just brand-name searches.

### What's actually server-rendered (i.e., what a crawler sees with zero JS)

Every public page's metadata (`title`, `description`, `keywords`,
canonical, Open Graph, JSON-LD) is set via Next's `generateMetadata` /
`metadata` export in a **Server Component**, so it's in the raw HTML
response — confirmed by inspecting `.next/server/app/*.html` after build.
Most content pages (About, amenities, Annex pages, Events, Offers,
Gallery, Contact, Short-let listings) are *entirely* server components —
zero client JS for the content itself. The few pages with real
interactivity (Home's date picker, Rooms' filter, Room Details' date
picker, Dining's tab toggle, Billboard's reservation modal, the full
booking flow) use small `'use client'` components — but in the App Router,
client components are *also* server-rendered on first load, so this
doesn't cost any SEO visibility; it only affects what ships as JS for
interactivity afterward.

### Structured data (JSON-LD)

- **Site-wide `Hotel` schema** (`app/(public)/layout.tsx`) — address, geo,
  phone, rating, amenities, `areaServed` — on every public page.
- **`Product` schema** on each room and short-let detail page (price,
  availability) — generated from live data, so it can't drift from the
  displayed price.
- **`Event` schema** on `/events` and `/club` for each published event.
- **`Restaurant` schema** on `/dining`.
- **`BreadcrumbList` schema** wherever the page shows a breadcrumb trail.

### Sitemap & robots

Both are Next.js native routes (`app/sitemap.ts`, `app/robots.ts`) —
generated from the same `roomTypes`/`shortLets` data the pages render from,
so they can't fall out of sync the way a hand-maintained static XML file
would. All five internal portals (`/account`, `/admin`, `/reception`,
`/housekeeping`, `/maintenance`) are disallowed in `robots.txt` and marked
`noindex` via their route-group `layout.tsx` — set once per portal, every
page under it inherits it automatically.

## Setting up your Google Business Profile (and other local listings)

This is the other half of ranking locally — the website alone won't get
you into the map pack. A few things worth getting right when you set this
up, since they directly determine whether Google trusts the site enough to
rank it locally:

1. **NAP consistency** — your Business Profile's Name, Address, and Phone
   must match `lib/siteConfig.ts` **exactly** (same abbreviations, same
   formatting). Mismatches are one of the most common reasons a listing
   fails to rank.
2. **Category** — set the primary category to "Hotel", and add secondary
   categories for what you actually have (Event Venue, Restaurant, Night
   Club) since those pages exist and can each help you surface in more
   searches.
3. **Service area / address pin** — place the pin precisely; Uromi is a
   small enough town that an imprecise pin can visibly hurt "near me"
   results.
4. **Photos** — upload real photos of the actual property (the site
   currently uses stock photography as placeholders — replace before
   launch, and use the same real photos on both the website and the
   Business Profile).
5. **Reviews** — ask checked-out guests to review on Google directly; review
   count and recency are a significant local-ranking factor, more so than
   most on-page SEO work.
6. **Link the website** — set the Business Profile's website field to
   `SITE_URL`, and once live, verify the site in Google Search Console and
   submit `/sitemap.xml` there directly rather than waiting for it to be
   discovered.

## Architecture notes (for whoever maintains this next)

- `data/mock.ts` is still the single mock data source — same shapes as the
  Vite version, so swapping in a real backend later is a data-layer swap,
  not a redesign (see the note in the original prototype's README on this).
- `store/useStore.ts` (Zustand) still drives all the interactive prototype
  behavior (booking creation, checkout → housekeeping, price edits,
  staff/permissions) — unchanged from the Vite version, just now only
  imported by client components.
- Server components import `data/mock.ts` **directly** (not through the
  store) so their content can render without any client-side JavaScript.
- `lib/buildMetadata.ts` is the one place that shapes every page's
  `<head>` — title template logic, canonical URLs, OG/Twitter tags. Change
  the shared logic once, it applies everywhere.
