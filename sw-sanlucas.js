// Service Worker — Medicina Interna · Hospital San Lucas
//
// Hace dos cosas, y ninguna es guardar datos de pacientes:
//
//  1. Permite instalar la página como aplicación en Android. Sin un trabajador
//     en segundo plano con manejo de «fetch», Chrome no ofrece instalarla.
//  2. Deja que abra sin señal, mostrando lo último que se vio.
//
// Es «red primero»: con señal siempre se usa lo que está en línea, y el caché
// solo entra cuando no hay internet. Así nunca se muestra una agenda vieja
// teniendo la buena a mano.
//
// La versión fuerza la actualización en todos los teléfonos. Cada vez que
// subas una versión nueva de la página, incrementá este número.
const CACHE_VERSION = 'sanlucas-v1';
const CACHE_NAME = `sanlucas-cache-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();            // la versión nueva manda de inmediato
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Solo lo del mismo sitio. Las consultas a Firebase NO se guardan: son datos
  // de pacientes y, sin red, una copia vieja de la agenda es peor que decir
  // que no hay conexión.
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copia).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(req))     // sin red → lo último que se vio
  );
});
