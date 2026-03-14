/**
 * main.js
 * 
 * The main orchestrator of the FieldMap application.
 * Manages the high-level state, wires event flow, and initializes modules.
 */

import { credentials_form, ensure_credentials } from './credentials.js';
import { create_map } from './map.js';
import { load_existing_markers } from './marker_loader.js';
import { init_image_acquisition } from './image_acquisition.js';
import { handle_image_selection } from './image_processing.js';
import { show_context_menu, hide_context_menu, is_context_menu_visible } from './context_menu.js';
import { show_warning } from './message_overlay.js';
import * as map_module from './map.js';
import * as events from './events.js';


async function bootstrap() {
    // 1. Setup credentials UI and ensure keys are available
    credentials_form.init();
    const creds = await ensure_credentials();

    // 2. Initialize map and location
    await create_map(creds.maptiler_key);


    // 3. Load existing markers from GitHub
    await load_existing_markers();

    // 4. Initialize Sub-modules
    init_image_acquisition();

    // 5. Wire Event Flow Interactivity

    // Tap on the map
    events.on('map_tap', (payload) => {
        if (is_context_menu_visible()) {
            hide_context_menu();
        } else {
            const subject = { lat: payload.lat, lon: payload.lon, click_target: 'map' };
            show_context_menu(subject, payload.point.x, payload.point.y);
        }
    });

    // Tap on an existing marker -> open context menu for replacing photo
    events.on('marker_tap', (payload) => {
        const subject = { lat: payload.lat, lon: payload.lon, click_target: 'photo_marker' };
        show_context_menu(subject, payload.point.x, payload.point.y);
    });

    // Auto-close menu when map is dragged/panned
    events.on('map_drag', () => {
        if (is_context_menu_visible()) {
            hide_context_menu();
        }
    });

    // Handle image selection (processing + upload)
    events.on('image_selected', handle_image_selection);

    // After upload is complete, update map markers
    events.on('upload_complete', (payload) => {
        const { lat, lon, isReplacing } = payload;

        // Add new marker to map if it wasn't a replacement
        if (!isReplacing) {
            map_module.add_marker(lat, lon);
        }

    });
}

// Start application
document.addEventListener('DOMContentLoaded', bootstrap);
