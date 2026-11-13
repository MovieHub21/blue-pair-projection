# SEO changes

## Lodge in Uromi (home page)
- Home title: "Hotel & Lodge in Uromi, Edo State | Blue Pair Signature"
- Home meta description, Open Graph/Twitter text, root-layout defaults updated to mention lodge/lodging
- Added lodge keywords (lodge in uromi, lodges in uromi, best lodge in uromi, ...)
- Visible hero eyebrow now reads "Hotel & Lodge in Uromi"
- Hotel JSON-LD: description, alternateName, areaServed, knowsAbout mention lodge in Uromi

## Fixes for pages dropping out of Google
- Broken image URLs on /club ("images/lawson.jpg" had no leading slash) and /gym (poster used /image/ instead of /images/)
- Mixed www / non-www image URLs standardised to https://bluepairsignature.com
- sitemap.ts no longer fails with a 500 if the database errors; added changeFrequency, /privacy, /terms
- robots.ts also blocks /auth/, /staff/, /dev/, /site-maintenance
- middleware.ts caches the maintenance-mode lookup (15s) so public pages/Googlebot don't wait on a DB query every request
- New schema.org JSON-LD: NightClub (club), HealthClub (gym), SportsActivityLocation (pool), BarOrPub (vip-lounge), EntertainmentBusiness (games), ImageGallery (gallery), Blog (blog index)
- Gallery and Offers pages got crawlable intro text (they were almost all images / cards)
- Blog index: robots + Open Graph image added
