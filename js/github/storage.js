/**
 * js/github/storage.js
 * 
 * Implements the storage operations specifically against the GitHub REST API.
 */

import { github_request } from './client.js';
import { coords_to_folder_name, get_unique_locations_from_tree, generate_storage_path, add_cache_buster } from '../utils.js';

/**
 * Fetches all existing coordinate folders using the Git Trees API.
 * @returns {Promise<Array<{lat: number, lon: number}>>}
 */
export async function load_markers() {
    try {
        const data = await github_request(add_cache_buster('git/trees/main?recursive=1'));
        if (!data || !data.tree) return [];
        
        return get_unique_locations_from_tree(data.tree);
    } catch (err) {
        console.error("Failed to load markers from GitHub:", err.message);
        return [];
    }
}

/**
 * Converts a Blob to a Base64 string for GitHub API upload.
 */
function blob_to_base64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // result is a data URL: data:image/jpeg;base64,xxxxxx...
            const base64_data = reader.result.split(',')[1];
            resolve(base64_data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Uploads a new image file to GitHub.
 * @param {string} path - The path to save the file at (e.g. photos/ lat_lon / IMG_xxx.jpg)
 * @param {Blob} blob - The image blob to upload.
 */
export async function upload_image(path, blob) {
    const base64_content = await blob_to_base64(blob);

    const body = {
        message: "add reference photo via FieldMap",
        content: base64_content
    };

    return github_request(`contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * Replaces an existing image at the specified coordinates by deleting old ones and uploading a new one.
 * This approach avoids GitHub CDN's aggressive caching of existing filenames.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Blob} blob - The new image blob
 */
export async function replace_image(lat, lon, blob) {
    const folder_path = `photos/${coords_to_folder_name(lat, lon)}`;

    // 1. Fetch current files to identify what needs to be deleted later
    let old_files;
    try {
        old_files = await github_request(add_cache_buster(`contents/${folder_path}`));
    } catch (err) {
        throw new Error(`Cannot replace photo: The coordinate folder '${folder_path}' could not be retrieved. ${err.message}`);
    }
    
    if (!old_files || old_files.length === 0) {
        throw new Error(`Cannot replace photo: No existing files found in '${folder_path}'.`);
    }

    // 2. Upload the new image with a fresh timestamp (generates a new URL)
    const new_path = generate_storage_path(lat, lon);
    const result = await upload_image(new_path, blob);

    // 3. Delete the old images
    // We do this after successful upload to ensure we don't end up with no photo if upload fails.
    for (const file of old_files) {
        // Safety: don't delete the file we just uploaded
        if (file.path === new_path) continue;

        const body = {
            message: "delete old reference photo via FieldMap replacement",
            sha: file.sha
        };

        try {
            await github_request(`contents/${file.path}`, {
                method: 'DELETE',
                body: JSON.stringify(body)
            });
        } catch (err) {
            // If deletion fails, we don't stop the whole process as the new file is already up.
            console.warn(`Failed to delete old file ${file.path} during replacement:`, err.message);
        }
    }

    return result;
}

/**
 * Deletes the file within a coordinate folder, effectively removing the marker.
 * Fails if the folder contains more than one image.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @throws {Error} If deletion fails or multiple files exist.
 */
export async function delete_marker(lat, lon) {
    const folder_path = `photos/${coords_to_folder_name(lat, lon)}`;

    // 1. Fetch current files in the folder
    let files;
    try {
        files = await github_request(add_cache_buster(`contents/${folder_path}`));
    } catch (err) {
        // Git doesn't track empty folders, so an empty folder will result in a 404.
        if (err.message && err.message.includes('404')) {
            throw new Error(`Target folder '${folder_path}' does not exist (it may have already been deleted).`);
        }
        throw err;
    }

    if (!Array.isArray(files) || files.length !== 1) {
        throw new Error(`Target folder '${folder_path}' does not contain exactly one image. Refusing to delete.`);
    }

    // 2. Delete the single file
    const file = files[0];
    const body = {
        message: `delete photo marker at ${lat}, ${lon} via FieldMap`,
        sha: file.sha
    };

    await github_request(`contents/${file.path}`, {
        method: 'DELETE',
        body: JSON.stringify(body)
    });
}

/**
 * Retrieves the direct download URL for the newest image found in the coordinate folder.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} The download URL or null if no image exists.
 */
export async function get_image_url(lat, lon) {
    const folder_path = `photos/${coords_to_folder_name(lat, lon)}`;

    try {
        const files = await github_request(add_cache_buster(`contents/${folder_path}`));
        if (files && files.length > 0) {
            // Ideally, there should only be one image per folder. However, during the
            // "Delete-and-Create" replacement process, there may be a brief moment 
            // where both the old and new images exist. Sorting alphabetically by the 
            // timestamped filename (IMG_TIMESTAMP.jpg) ensures we always pick the newest.
            files.sort((a, b) => a.path.localeCompare(b.path));
            // Return the download_url of the newest file
            return files[files.length - 1].download_url;
        }
    } catch (err) {
        // If 404, it just means no photo exists yet for these coords
        if (!err.message.includes('404')) {
            console.error("Failed to fetch image URL:", err.message);
        }
    }
    return null;
}
