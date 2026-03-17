/**
 * context_menu_thumbnail.js
 * 
 * Manages the thumbnail display logic within the context menu.
 */

import * as storage from './storage_api.js';

/**
 * Updates the context menu thumbnail based on the current location and action type.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {boolean} is_replacing - Whether we are interacting with an existing marker
 */
export function update_thumbnail(lat, lon, is_replacing) {
    const thumb_img = document.getElementById('menu_thumbnail');
    const thumb_link = document.getElementById('menu_thumbnail_link');
    const thumb_error = document.getElementById('menu_thumbnail_error');
    const menu_el = document.getElementById('context_menu');

    if (!thumb_img || !thumb_error || !menu_el || !thumb_link) return;

    // Reset state
    thumb_img.src = '';
    thumb_link.href = '#';
    thumb_error.style.display = 'none';
    thumb_error.textContent = '';
    menu_el.classList.remove('existing-marker');

    if (is_replacing) {
        menu_el.classList.add('existing-marker');
        // Fetch and display the thumbnail
        storage.get_image_url(lat, lon).then((url) => {
            if (url) {
                // Add cache-buster to ensure we get the latest image
                const cacheBuster = `?t=${Date.now()}`;
                const finalUrl = `${url}${cacheBuster}`;
                thumb_img.src = finalUrl;
                thumb_link.href = finalUrl;
            } else {
                thumb_error.textContent = 'No photo available';
                thumb_error.style.display = 'block';
            }
        }).catch(err => {
            console.error("Failed to load thumbnail:", err);
            thumb_error.textContent = 'Failed to load this image';
            thumb_error.style.display = 'block';
        });
    }
}
