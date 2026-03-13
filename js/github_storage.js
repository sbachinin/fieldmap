/**
 * github_storage.js
 * 
 * Implements the storage operations specifically against the GitHub REST API.
 */

import { get_credentials } from './credentials.js';
import { generate_storage_path, coords_to_folder_name } from './utils.js';
import { GITHUB_CONFIG } from './constants.js';

const { OWNER, REPO } = GITHUB_CONFIG;

function get_headers() {
    const { github_token } = get_credentials();
    if (!github_token) {
        throw new Error("GitHub token is missing in credentials.");
    }
    return {
        'Authorization': `Bearer ${github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
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
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
    const base64Content = await blob_to_base64(blob);

    const body = {
        message: "add reference photo via FieldMap",
        content: base64Content
    };

    const res = await fetch(url, {
        method: 'PUT',
        headers: get_headers(),
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`GitHub API upload failed: ${res.statusText} - ${errorData.message || ''}`);
    }
    
    return await res.json();
}

/**
 * Replaces an existing image at the specified coordinates by fetching its SHA first.
 * Overwrites the first file found in the coordinate folder, or normal upload if none exists.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Blob} blob - The new image blob
 */
export async function replace_image(lat, lon, blob) {
    const folder_url = 'https://api.github.com/repos/' +
        OWNER + '/' +
        REPO + '/contents/photos/' +
        coords_to_folder_name(lat, lon);

    const res = await fetch(folder_url, { headers: get_headers() });
    
    // If the folder doesn't exist, we fall through to regular upload
    if (!res.ok) {
        const path = generate_storage_path(lat, lon);
        return upload_image(path, blob);
    }

    const files = await res.json();
    
    // If folder is somehow empty, fall through to regular upload
    if (!files || files.length === 0) {
        const path = generate_storage_path(lat, lon);
        return upload_image(path, blob);
    }

    // Usually there is only 1 file per folder. We replace the first one.
    const file = files[0];
    const fileUrl = file.url; // This is the exact API endpoint to PUT updates to this specific file
    const base64Content = await blob_to_base64(blob);

    const body = {
        message: "replace reference photo via FieldMap",
        content: base64Content,
        sha: file.sha // Required by GitHub API to update/overwrite an existing file
    };

    const updateRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: get_headers(),
        body: JSON.stringify(body)
    });

    if (!updateRes.ok) {
        const errorData = await updateRes.json().catch(() => ({}));
        throw new Error(`GitHub API replace failed: ${updateRes.statusText} - ${errorData.message || ''}`);
    }

    return await updateRes.json();
}

/**
 * Placeholder implementation, marker_loader.js normally handles tree fetching directly.
 */
export async function list_images() {
    throw new Error("list_images not implemented directly in storage API. Use marker_loader.js Git Trees API approach.");
}
