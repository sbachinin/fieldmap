/**
 * js/share_stash.js
 * 
 * Manages the "share-target" stashed image state.
 * This module handles retrieving the shared image from IndexedDB, 
 * showing the UI indicator, and providing the image to the context menu.
 */

const DB_NAME = 'fieldmap-share-db';
const STORE_NAME = 'share-stash';

let stashed_file = null;

// UI Elements (initialized in init_ui)
let stash_indicator = null;
let stash_thumbnail = null;
let stash_close_btn = null;

/**
 * Initializes the share stash module.
 */
export async function init_share_stash() {
    init_ui();
    await check_stash();
}

/**
 * Creates and initializes the UI indicator for the stashed image.
 */
function init_ui() {
    // Check if indicator already exists
    if (document.getElementById('share_stash_indicator')) return;

    // Create container
    stash_indicator = document.createElement('div');
    stash_indicator.id = 'share_stash_indicator';
    stash_indicator.className = 'share-stash-indicator hidden';
    
    // Create thumbnail
    stash_thumbnail = document.createElement('img');
    stash_thumbnail.className = 'stash-thumbnail';
    stash_indicator.appendChild(stash_thumbnail);
    
    // Create close button
    stash_close_btn = document.createElement('button');
    stash_close_btn.className = 'stash-close-btn';
    stash_close_btn.innerHTML = '×';
    stash_close_btn.title = 'Clear shared image';
    stash_indicator.appendChild(stash_close_btn);

    // Add to body
    document.body.appendChild(stash_indicator);

    // Event listeners
    stash_close_btn.addEventListener('click', (e) => {
        e.stopPropagation();
        clear_stash();
    });
}

/**
 * Checks IndexedDB for a stashed image and updates the UI.
 */
async function check_stash() {
    try {
        const file = await get_from_indexeddb();
        if (file) {
            stashed_file = file;
            show_indicator(file);
        } else {
            stashed_file = null;
            hide_indicator();
        }
    } catch (err) {
        console.error('Failed to check share stash:', err);
    }
}

/**
 * Displays the stash indicator with a thumbnail.
 */
function show_indicator(file) {
    if (!stash_indicator || !stash_thumbnail) return;

    const url = URL.createObjectURL(file);
    stash_thumbnail.src = url;
    stash_indicator.classList.remove('hidden');
}

/**
 * Hides the stash indicator.
 */
function hide_indicator() {
    if (!stash_indicator) return;
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
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const get_request = store.get('stashed-image');
            get_request.onsuccess = () => {
                db.close();
                resolve(get_request.result);
            };
            get_request.onerror = () => reject(get_request.error);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Clears the stashed image from state and IndexedDB.
 */
export async function clear_stash() {
    stashed_file = null;
    hide_indicator();
    
    try {
        await new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.delete('stashed-image');
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            };
            request.onerror = () => reject(request.error);
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
