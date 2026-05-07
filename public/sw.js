// Service Worker básico — permite instalação como PWA
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("fetch", (event) => {
  // Passa todas as requisições direto para a rede
  event.respondWith(fetch(event.request));
});
