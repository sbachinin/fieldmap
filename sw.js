/**
 * sw.js
 * 
 * A minimal service worker to satisfy PWA requirements for "standalone" mode.
 * This worker doesn't cache anything by default but handles the fetch event.
 * Also handles the "share-target" POST request.
 */

const CACHE_NAME = 'fieldmap-v1';
const DB_NAME = 'fieldmap-share-db';
const STORE_NAME = 'share-stash';

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Become the active service worker for all clients.
    event.waitUntil(clients.claim());
});

/**
 * Stores a file in IndexedDB.
 */
async function store_shared_file(file) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(file, 'stashed-image');
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle the share-target POST request
    if (event.request.method === 'POST' && url.searchParams.has('share-target')) {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('files');
                
                if (file) {
                    await store_shared_file(file);
                }
            } catch (err) {
                console.error('Failed to handle share-target POST:', err);
            }

            // Redirect to the main app URL after processing
            // Using an absolute URL is more robust for Response.redirect
            const redirectUrl = new URL('./', url).href;
            return Response.redirect(redirectUrl, 303);
        })());
        return;
    }

    // Default fetch handler
    event.respondWith(fetch(event.request));
});
