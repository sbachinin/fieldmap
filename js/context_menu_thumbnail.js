/**
 * context_menu_thumbnail.js
 * 
 * Manages the thumbnail display logic within the context menu.
 */

import * as storage from './storage_api.js';

let image_request_counter = 0;

// Cache static UI elements
const thumb_img = document.getElementById('menu_thumbnail');
const thumb_link = document.getElementById('menu_thumbnail_link');
const thumb_error = document.getElementById('menu_thumbnail_error');

/**
 * Loads the thumbnail for an existing marker.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
export function load_thumbnail(lat, lon) {
    const request_id = ++image_request_counter;

    // Reset UI to indicate we are loading an existing marker
    thumb_img.removeAttribute('src');
    thumb_link.removeAttribute('href');
    thumb_error.style.display = 'none';

    // Fetch and display the thumbnail
    storage.get_image_url(lat, lon).then((url) => {
        if (request_id !== image_request_counter) return;

        if (url) {
            // Add cache-buster to ensure we get the latest image
            const final_url = `${url}?t=${Date.now()}`;
            thumb_img.src = final_url;
            thumb_link.href = final_url;
        } else {
            thumb_error.textContent = 'No photo available';
            thumb_error.style.display = 'block';
        }
    }).catch(err => {
        if (request_id !== image_request_counter) return;
        console.error("Failed to load thumbnail:", err);
        thumb_error.textContent = 'Failed to load this image';
        thumb_error.style.display = 'block';
    });
}

/**
 * Resets the thumbnail UI to a clean state.
 */
export function clear_thumbnail() {
    image_request_counter++; // Invalidate any pending requests

    thumb_img.removeAttribute('src');
    thumb_link.removeAttribute('href');
    thumb_error.style.display = 'none';
    thumb_error.textContent = '';
}
