/**
 * storage_api.js
 * 
 * Abstraction layer for storage operations.
 * The application interacts with this module, unaware of the specific backing storage.
 */

import * as github_storage from './github/storage.js';

/**
 * Fetches all existing coordinate folders from the storage provider.
 * @returns {Promise<Array<{lat: number, lon: number}>>}
 */
export async function load_markers() {
    return await github_storage.load_markers();
}

/**
 * Uploads a new image file to the storage provider.
 */
export async function upload_image(path, blob) {
    return await github_storage.upload_image(path, blob);
}

/**
 * Replaces an existing image at the specified coordinates.
 */
export async function replace_image(lat, lon, blob) {
    return await github_storage.replace_image(lat, lon, blob);
}

/**
 * Deletes all files at the specified coordinates, effectively removing the marker.
 */
export async function delete_marker(lat, lon) {
    return await github_storage.delete_marker(lat, lon);
}

/**
 * Retrieves the image URL for the specified coordinates.
 */
export async function get_image_url(lat, lon) {
    return await github_storage.get_image_url(lat, lon);
}
