/**
 * github_storage.js
 * 
 * Implements the storage operations specifically against the GitHub REST API.
 */

import { get_credentials } from './credentials.js';
import { generate_storage_path, coords_to_folder_name } from './utils.js';
import { GITHUB_CONFIG } from './constants.js';

const { OWNER, REPO } = GITHUB_CONFIG;

async function github_request(endpoint, options = {}) {
    const { github_token } = get_credentials();
    if (!github_token) {
        throw new Error("GitHub token is missing in credentials.");
    }

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${endpoint}`;
    
    const headers = {
        'Authorization': `Bearer ${github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`GitHub API request failed: ${res.statusText} - ${errorData.message || ''}`);
    }

    return await res.json();
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

    return github_request(path, {
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
        files = await github_request(folderPath);
    } catch (err) {
        // If the folder doesn't exist, we fall through to regular upload
        const path = generate_storage_path(lat, lon);
        return upload_image(path, blob);
    }
    
    // If folder is somehow empty, fall through to regular upload
    if (!files || files.length === 0) {
        const path = generate_storage_path(lat, lon);
        return upload_image(path, blob);
    }

    // Usually there is only 1 file per folder. We replace the first one.
    const file = files[0];
    const base64Content = await blob_to_base64(blob);

    const body = {
        message: "replace reference photo via FieldMap",
        content: base64Content,
        sha: file.sha // Required by GitHub API to update/overwrite an existing file
    };

    return github_request(file.path, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * Placeholder implementation, marker_loader.js normally handles tree fetching directly.
 */
export async function list_images() {
    throw new Error("list_images not implemented directly in storage API. Use marker_loader.js Git Trees API approach.");
}
