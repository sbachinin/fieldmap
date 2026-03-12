/**
 * utils.js
 * 
 * General utility functions for the application.
 */

/**
 * Generates a storage path adhering to the folder structure specification:
 * Latitude_Longitude/IMG_Timestamp.jpg
 * Coordinates are rounded to 5 decimals (~1 meter precision).
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} The path intended for GitHub storage.
 */
export function generate_storage_path(lat, lon) {
    // Format coordinates to 5 decimal places precision.
    // Handles negative coordinates correctly via toFixed
    const latStr = Number(lat).toFixed(5);
    const lonStr = Number(lon).toFixed(5);
    
    // Generate unique internal filename using timestamp
    const timestamp = Date.now();
    
    return `photos/${latStr}_${lonStr}/IMG_${timestamp}.jpg`;
}
