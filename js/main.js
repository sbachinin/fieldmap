/**
 * main.js
 * 
 * The main orchestrator of the FieldMap application.
 * Manages the high-level state, wires event flow, and initializes modules.
 */

import { init_credentials } from './credentials.js';
import { create_map, reload_map_style } from './map.js';
import { load_existing_markers } from './marker_loader.js';
import { init_image_acquisition } from './image_acquisition.js';
import { init_image_processing } from './image_processing.js';
import { show_context_menu, hide_context_menu, is_context_menu_visible } from './context_menu.js';
import * as storage_api from './storage_api.js';
import * as map_module from './map.js';
import * as events from './events.js';
import { init as init_message_overlay, show_loading, show_success, show_error } from './message_overlay.js';

// Application State
let current_active_coordinates = null;

async function bootstrap() {
    // Initialize message overlay system
    init_message_overlay();
    
    // 1. Ensure credentials are available (resolves immediately or waits for user input)
    const creds = await init_credentials();

    // 2. Initialize map and location
    await create_map(creds.maptiler_key);

    // Reload map style whenever credentials are updated later (e.g. to fix a wrong key)
    events.on('credentials_saved', (payload) => {
        reload_map_style(payload.maptiler_key);
        load_existing_markers();
    });


    // 3. Load existing markers from GitHub
    await load_existing_markers();

    // 4. Initialize Sub-modules
    init_image_acquisition();
    init_image_processing();

    // 5. Wire Event Flow Interactivity

    // Tap on the map
    events.on('map_tap', (payload) => {
        // If a context menu is currently open, a click anywhere (including map) 
        // should just close it rather than spawning a new marker prompt.
        if (is_context_menu_visible()) {
            hide_context_menu();
        } else {
            current_active_coordinates = { lat: payload.lat, lon: payload.lon, is_existing: false };
            show_context_menu(payload.lat, payload.lon, false, payload.point.x, payload.point.y);
        }
    });

    // Tap on an existing marker -> open context menu for replacing photo
    events.on('marker_tap', (payload) => {
        current_active_coordinates = { lat: payload.lat, lon: payload.lon, is_existing: true };
        show_context_menu(payload.lat, payload.lon, true, payload.point.x, payload.point.y);
    });

    // Auto-close menu when map is dragged/panned
    events.on('map_drag', () => {
        if (is_context_menu_visible()) {
            hide_context_menu();
        }
    });

    // After image is acquired and processed, handle upload depending on scenario
    events.on('image_processed', async (payload) => {
        const lat = payload.lat;
        const lon = payload.lon;
        const isReplacing = current_active_coordinates?.is_existing || false;

        // Show uploading indicator
        show_loading(isReplacing ? "Replacing photo..." : "Uploading photo...");

        try {
            if (isReplacing) {
                await storage_api.replace_image(lat, lon, payload.blob);
            } else {
                const { generate_storage_path } = await import('./utils.js');
                const path = generate_storage_path(lat, lon);
                await storage_api.upload_image(path, payload.blob);
            }

            // Emit success
            events.emit('upload_complete', { lat, lon });

            // Add new marker to map if it wasn't a replacement
            if (!isReplacing) {
                map_module.add_marker(lat, lon, false);
            }

            show_success("Upload successful!");
        } catch (err) {
            console.error(err);
            show_error("Upload failed. Check connection or token.");
        } finally {
            current_active_coordinates = null; // Clear state
        }
    });
}

// Start application
document.addEventListener('DOMContentLoaded', bootstrap);
