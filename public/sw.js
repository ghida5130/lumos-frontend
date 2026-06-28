const CACHE_NAME = 'lumos-pwa-v2'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/favicon.ico',
  '/icons/favicon.svg',
  '/icons/favicon-96x96.png',
  '/icons/apple-touch-icon.png',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')))
    return
  }

  if (new URL(event.request.url).origin !== self.location.origin) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    }),
  )
})
