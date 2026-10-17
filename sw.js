// Service worker — Lançamento CSL. App funciona offline; ventos sempre buscados na rede.
const V = 'lcsl-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'lcsl-tiles').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trim(name, max) { const c = await caches.open(name); const ks = await c.keys(); for (let i = 0; i < ks.length - max; i++) await c.delete(ks[i]); }
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (/open-meteo\.com$/.test(u.hostname)) return;               // dados meteorológicos: sempre rede
  if (/arcgisonline\.com$/.test(u.hostname)) {                    // satélite: cache para uso em campo
    e.respondWith(caches.open('lcsl-tiles').then(async c => { const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request); if (r.ok || r.type === 'opaque') { c.put(e.request, r.clone()); trim('lcsl-tiles', 600); } return r; }));
    return;
  }
  e.respondWith(caches.open(V).then(async c => {                  // app, fontes, Leaflet: cache + atualização em segundo plano
    const hit = await c.match(e.request, {ignoreSearch: u.origin === location.origin});
    const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
