/**
 * js/github/storage.js
 * 
 * Implements the storage operations specifically against the GitHub REST API.
 */

import { github_request } from './client.js';
import { coords_to_folder_name, get_unique_locations_from_tree } from '../utils.js';

/**
 * Fetches all existing coordinate folders using the Git Trees API.
 * @returns {Promise<Array<{lat: number, lon: number}>>}
 */
export async function load_markers() {
    try {
        const data = await github_request('git/trees/main?recursive=1');
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
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
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
    const base64Content = await blob_to_base64(blob);

    const body = {
        message: "add reference photo via FieldMap",
        content: base64Content
    };

    return github_request(`contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * Replaces an existing image at the specified coordinates by fetching its SHA first.
 * Overwrites the first file found in the coordinate folder, or normal upload if none exists.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Blob} blob - The new image blob
 */
export async function replace_image(lat, lon, blob) {
    const folderPath = `photos/${coords_to_folder_name(lat, lon)}`;

    let files;
    try {
        files = await github_request(`contents/${folderPath}`);
    } catch (err) {
        throw new Error(`Cannot replace photo: The coordinate folder '${folderPath}' could not be retrieved. ${err.message}`);
    }
    
    // If folder is somehow empty, we cannot "replace" anything.
    if (!files || files.length === 0) {
        throw new Error(`Cannot replace photo: No existing files found in '${folderPath}'.`);
    }

    // Defensive check: If there are multiple files, we don't know which one to replace.
    // This indicates an architectural or manual data entry problem.
    if (files.length > 1) {
        throw new Error(`Cannot replace photo: The coordinate folder '${folderPath}' contains ${files.length} files. Expected exactly 1. This suggests an architectural inconsistency.`);
    }

    // Replace the single existing file.
    const file = files[0];
    const base64Content = await blob_to_base64(blob);

    const body = {
        message: "replace reference photo via FieldMap",
        content: base64Content,
        sha: file.sha // Required by GitHub API to update/overwrite an existing file
    };

    return github_request(`contents/${file.path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

