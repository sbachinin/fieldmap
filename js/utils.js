/**
 * utils.js
 * 
 * General utility functions for the application.
 */

/**
 * Formats coordinates into a consistent folder name: "LAT_LON"
 * rounded to 5 decimal places (~1 meter precision).
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} The folder name.
 */
export function coords_to_folder_name(lat, lon) {
    const latStr = Number(lat).toFixed(5);
    const lonStr = Number(lon).toFixed(5);
    return `${latStr}_${lonStr}`;
}

/**
 * Generates a storage path adhering to the folder structure specification:
 * Latitude_Longitude/IMG_Timestamp.jpg
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} The path intended for GitHub storage.
 */
export function generate_storage_path(lat, lon) {
    const folder = coords_to_folder_name(lat, lon);
    return `photos/${folder}/IMG_${Date.now()}.jpg`;
}

/**
 * Appends a cache-busting timestamp to a URL.
 * 
 * @param {string} url - The URL to append the cache buster to.
 * @returns {string} The URL with the cache buster.
 */
export function add_cache_buster(url) {
    if (!url) return url;
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
}
