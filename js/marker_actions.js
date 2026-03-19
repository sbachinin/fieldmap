/**
 * marker_actions.js
 * 
 * High-level handlers for user-triggered marker operations.
 * Orchestrates storage calls and UI feedback.
 */

import { show_warning, show_success, show_loading, show_error } from './message_overlay.js';
import * as storage_api from './storage_api.js';
import * as events from './events.js';
import { generate_storage_path } from './utils.js';

/**
 * Handles the deletion of a marker and its associated photos.
 */
export async function handle_delete_marker(lat, lon) {
    try {
        show_loading("Deleting marker...");
        await storage_api.delete_marker(lat, lon);
        show_success("Marker deleted successfully.");
    } catch (err) {
        show_warning(`Failed to delete marker: ${err.message}`);
    } finally {
        // Notify the app that markers have changed and need re-syncing
        events.emit('markers_changed');
    }
}

/**
 * Handles the upload and subsequent success UI of a processed image blob.
 */
export async function handle_upload_processed_image(blob, action) {
    const { lat, lon, is_replacing } = action;

    show_loading(is_replacing ? "Replacing photo..." : "Uploading photo...");
            
    try {
        if (is_replacing) {
            await storage_api.replace_image(lat, lon, blob);
        } else {
            const path = generate_storage_path(lat, lon);
            await storage_api.upload_image(path, blob);
        }

        show_success("Upload successful!");
        events.emit('markers_changed');
    } catch (error) {
        show_error(`Failed to save marker: ${error.message}`);
        throw error; // Re-throw so the caller knows it failed
    }
}
