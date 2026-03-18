/**
 * marker_actions.js
 * 
 * High-level handlers for user-triggered marker operations.
 * Orchestrates storage calls and UI feedback.
 */

import { show_warning, show_success, show_loading } from './message_overlay.js';
import * as storage_api from './storage_api.js';
import * as events from './events.js';

/**
 * Handles the deletion of a marker and its associated photos.
 */
export async function handle_delete_marker(lat, lon) {
    try {
        show_loading("Deleting marker...");
        await storage_api.delete_marker(lat, lon);
        show_success("Marker deleted successfully.");
    } catch (err) {
        if (err.name === 'PartialDeletionError') {
            show_warning(err.message);
        } else {
            show_warning(`Failed to delete marker: ${err.message}`);
        }
    } finally {
        // Notify the app that markers have changed and need re-syncing
        events.emit('markers_changed');
    }
}
