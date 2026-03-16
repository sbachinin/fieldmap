/**
 * sw.js
 * 
 * A minimal service worker to satisfy PWA requirements for "standalone" mode.
 * This worker doesn't cache anything by default but handles the fetch event.
 */

const CACHE_NAME = 'fieldmap-v1';

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Become the active service worker for all clients.
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Minimal fetch handler to satisfy PWA requirements.
    // In a real app, you'd implement caching here.
    event.respondWith(fetch(event.request));
});
