/**
 * storage_api.js
 * 
 * Abstraction layer for storage operations.
 * The application interacts with this module, unaware of the specific backing storage.
 */

import * as github_storage from './github_storage.js';

export async function upload_image(path, blob) {
    return await github_storage.upload_image(path, blob);
}

export async function replace_image(lat, lon, blob) {
    return await github_storage.replace_image(lat, lon, blob);
}

export async function list_images() {
    return await github_storage.list_images();
}
