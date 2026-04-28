// public/service-worker.js

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting(); // Activate new service worker immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim()); // Take control of all pages
});

self.addEventListener('fetch', (event) => {
  // This service worker is primarily for background sync,
  // so we don't need extensive caching for fetch events for this issue.
  // For a full PWA, you would add caching strategies here.
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-mint-sync') {
    console.log('Background sync triggered for offline-mint-sync');
    // In a real application, you would trigger the sync logic here
    // For this example, the sync logic is primarily handled in offlineSyncService.ts on the main thread.
  }
});