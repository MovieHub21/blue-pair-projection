const CACHE_NAME = 'blue-pair-static-v3'

// Only cache same-origin files whose URLs identify static assets. In
// particular, API responses, page data, auth, and realtime traffic are never
// handled by this cache.
const STATIC_ASSET = /\.(?:avif|css|gif|ico|jpe?g|js|mjs|mp4|otf|png|svg|ttf|webmanifest|webp|woff2?)$/i

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never let the PWA cache application/API/auth responses.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/auth/')
  ) return

  // Always fetch navigations from the network so a new deployment is
  // immediately visible instead of being served from an old app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() =>
        new Response('You are offline. Reconnect and try again.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      )
    )
    return
  }

  // Cache only recognizable static assets. Network-first keeps unversioned
  // public files current after deployments, with the cache as an offline fallback.
  if (!STATIC_ASSET.test(url.pathname)) return

  const assetRequest = fetch(event.request)
  event.respondWith(assetRequest.catch(async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached
      return new Response('', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }))
  event.waitUntil(assetRequest.then(async (response) => {
    if (response.ok && response.type === 'basic') {
      await (await caches.open(CACHE_NAME)).put(event.request, response.clone())
    }
  }).catch(() => {}))
})
