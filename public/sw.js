const CACHE_NAME = 'blue-pair-static-v2'
const APP_SHELL = ['/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
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
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/manifest.webmanifest'))
    )
    return
  }

  // Static assets use the normal browser cache. Next.js serves hashed
  // assets, so a new deployment gets new URLs automatically.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
