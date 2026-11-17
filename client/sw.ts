/// <reference lib="webworker" />
// 3D 地図の Service Worker。public/sw.js に変換して /sw.js で返す (app/app.vue が登録する)
// ホーム画面に追加してアプリのように開けるようにするためのもの。地図のデータ (API の maps/ など) は別のサイトから来るので、そもそも扱わない
// - ページを開くとき: いつもネットから。つながらないときはオフラインのページ (public/pwa/offline.html)
// - /_nuxt/ の js と css: 名前にバージョンが入っていて中身が変わらないので、一度読んだものはキャッシュから
// モジュールにして、self を Service Worker の型で宣言し直す
export {}
declare const self: ServiceWorkerGlobalScope

// 変えたら数を上げる (古いキャッシュは activate で消える)
const VERSION = 1
const SHELL = `toro-3d-shell-${VERSION}`
const ASSETS = `toro-3d-assets-${VERSION}`
const OFFLINE = '/pwa/offline.html'
// /_nuxt/ のキャッシュに残す数 (更新のたびに名前が変わるので、古いものから消す)
const MAX_ASSETS = 120

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    await cache.add(new Request(OFFLINE, { cache: 'reload' }))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('toro-3d-') && key !== SHELL && key !== ASSETS) await caches.delete(key)
    }
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE, { cacheName: SHELL })) ?? Response.error()))
    return
  }
  if (url.pathname.startsWith('/_nuxt/')) event.respondWith(cacheFirst(request))
})

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone())
    const keys = await cache.keys()
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key)
  }
  return response
}