/**
 * js/share_stash.js
 * 
 * Manages the "share-target" stashed image state.
 * This module handles retrieving the shared image from IndexedDB, 
 * showing the UI indicator, and providing the image to the context menu.
 */

import { convert_heic_if_needed } from './image_processing.js';
import { hide_message_overlay } from './message_overlay.js';

const DB_NAME = 'fieldmap-share-db';
const STORE_NAME = 'share-stash';

let stashed_file = null;

// UI Elements cached at module scope
const stash_indicator = document.getElementById('share_stash_indicator');
const stash_thumbnail = document.getElementById('stash_thumbnail');
const stash_close_btn = document.getElementById('stash_close_btn');

// Setup close button listener immediately
stash_close_btn.addEventListener('click', (e) => {
    e.stopPropagation();
    clear_stash();
});

let db_promise = null;

/**
 * Helper to open the IndexedDB and ensure the object store exists.
 * @returns {Promise<IDBDatabase>}
 */
function get_db() {
    if (!db_promise) {
        db_promise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    return db_promise;
}

/**
 * Checks IndexedDB for a stashed image and updates the UI.
 * NOTE: on page load it's necessary to check stash,
 * because the whole share flow works via redirect
 */
export async function check_stash() {
    try {
        let file = await get_from_indexeddb();
        if (file) {
            file = await convert_heic_if_needed(file);
            hide_message_overlay();
            stashed_file = file;
            show_indicator(file);
        } else {
            stashed_file = null;
            hide_indicator();
        }
    } catch (err) {
        console.error('Failed to check share stash:', err);
        hide_message_overlay();
    }
}

/**
 * Displays the stash indicator with a thumbnail.
 */
function show_indicator(file) {
    if (stash_thumbnail.src) {
        URL.revokeObjectURL(stash_thumbnail.src)
    }

    const url = URL.createObjectURL(file)
    stash_thumbnail.src = url
    stash_indicator.classList.remove('hidden')
}

/**
 * Hides the stash indicator.
 */
function hide_indicator() {
    stash_indicator.classList.add('hidden');
    if (stash_thumbnail.src) {
        URL.revokeObjectURL(stash_thumbnail.src);
        stash_thumbnail.src = '';
    }
}

/**
 * Retrieves the stashed image from IndexedDB.
 */
async function get_from_indexeddb() {
    const db = await get_db();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('stashed-image');

        req.onsuccess = () => {
            resolve(req.result);
        };
        req.onerror = () => reject(req.error);
    });
}

/**
 * Clears the stashed image from state and IndexedDB.
 */
export async function clear_stash() {
    stashed_file = null;
    hide_indicator();

    try {
        const db = await get_db();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete('stashed-image');

            tx.oncomplete = () => {
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error('Failed to clear share stash from IndexedDB:', err);
    }
}

/**
 * Returns the currently stashed file, if any.
 * @returns {File|null}
 */
export function get_stashed_file() {
    return stashed_file;
}
