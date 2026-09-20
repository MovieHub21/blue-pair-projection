/**
 * Decides where a page's "Back" button should go, and whether it should exist at all.
 *
 * A back button only helps on inner pages (a single room type, a single room, a blog story, a
 * short-let listing...). Top-level pages such as /rooms, /dining or /gallery are one tap away in the
 * navigation bar, so they get no button. Inner pages go back to their parent page, so
 * /rooms/standard/room-101 -> /rooms/standard -> /rooms, instead of depending on browser history
 * (which could lead somewhere unrelated, such as another site).
 */

/** Names the site's navigation uses for section pages; anything else is derived from the URL. */
const SECTION_LABELS: Record<string, string> = {
  '/rooms': 'Rooms',
  '/blog': 'Blog',
  '/annex': 'The Annex',
  '/annex/shortlets': 'Short-lets',
}

export function normalizePath(pathname: string | null | undefined) {
  const path = (pathname || '/').split('?')[0].split('#')[0]
  return path.length > 1 ? path.replace(/\/+$/, '') || '/' : path
}

/** '/rooms/standard/room-101' -> '/rooms/standard'. Top-level pages ('/rooms', '/') have no parent. */
export function parentPath(pathname: string | null | undefined) {
  const segments = normalizePath(pathname).split('/').filter(Boolean)
  return segments.length < 2 ? null : '/' + segments.slice(0, -1).join('/')
}

/** Public website: an inner page (two or more segments) goes back to its parent; top-level pages get no button. */
export function getPublicBackTarget(pathname: string | null | undefined) {
  return parentPath(pathname)
}

/** Human name for a path: the navigation's name for known sections, otherwise the last URL segment, tidied up. */
export function labelForPath(path: string) {
  const normalized = normalizePath(path)
  if (SECTION_LABELS[normalized]) return SECTION_LABELS[normalized]
  const last = normalized.split('/').filter(Boolean).pop() || 'Home'
  const words = decodeURIComponent(last).replace(/[-_]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Home'
}

/**
 * Staff and account portals: every page in the sidebar is a top-level page and gets no button.
 * Any other page (a report, an item detail...) goes back to the closest parent page that is in the
 * sidebar, or to the portal's home page when it has none.
 */
export function getPortalBackTarget(pathname: string | null | undefined, navHrefs: string[], portalHome: string) {
  const path = normalizePath(pathname)
  const home = normalizePath(portalHome)
  const nav = new Set(navHrefs.map(normalizePath))
  if (path === home || nav.has(path)) return null

  const segments = path.split('/').filter(Boolean)
  for (let length = segments.length - 1; length >= 1; length--) {
    const candidate = '/' + segments.slice(0, length).join('/')
    if (nav.has(candidate)) return candidate
  }
  return home
}
