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
