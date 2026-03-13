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
 * Extracts latitude and longitude from a path or folder name.
 * Expected format: ".../LAT_LON/..." or just "LAT_LON"
 * 
 * @param {string} path - The path or folder name to parse.
 * @returns {{lat: number, lon: number} | null} The coordinates or null if invalid.
 */
export function parse_coords_from_path(path) {
    // If it's a full path, we need to extract the folder name part.
    // The format is "photos/LAT_LON/..."
    let folderName = path;
    if (path.includes('photos/')) {
        folderName = path.split('photos/')[1].split('/')[0];
    }

    if (folderName.includes('_')) {
        const parts = folderName.split('_');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon };
            }
        }
    }
    return null;
}
