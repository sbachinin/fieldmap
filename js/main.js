/**
 * main.js
 * 
 * The main orchestrator of the FieldMap application.
 * Manages the high-level state, wires event flow, and initializes modules.
 */

import { credentials_form, ensure_credentials } from './credentials.js';
import { create_map } from './map.js';
import * as storage_api from './storage_api.js';
import { init_image_acquisition } from './image_acquisition.js';
import { handle_image_selection } from './image_processing.js';
import { show_context_menu, hide_context_menu, is_context_menu_visible } from './context_menu.js';
import { init_user_location } from './user_location.js';
import * as map_module from './map.js';
import * as events from './events.js';
import { check_browser_and_block_if_needed } from './browser_check.js';
import { show_warning } from './message_overlay.js';
import { handle_delete_marker } from './marker_actions.js';
import { check_stash, clear_stash } from './share_stash.js';

/**
 * Initializes PWA-specific UI elements, such as a manual refresh button.
 * Only shows the button if the app is running in "standalone" mode.
 */
function init_pwa_refresh_button() {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const refreshBtn = document.getElementById('refresh_btn');
    
    if (isPWA && refreshBtn) {
        refreshBtn.style.display = 'flex';
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

/**
 * Re-fetches all markers from storage and re-renders them on the map.
 * Ensures the UI is a perfect reflection of the remote repository.
 */
async function sync_map_markers() {
    try {
        const locations = await storage_api.load_markers();
        map_module.clear_markers();
        map_module.add_markers(locations);
    } catch (err) {
        console.error("Failed to sync markers:", err);
        show_warning("Failed to refresh markers from server.");
    }
}

async function bootstrap() {
    // 0. Block execution if Firefox mobile is detected
    if (check_browser_and_block_if_needed()) {
        console.warn("Application execution blocked on Firefox mobile.");
        return;
    }

    // 0.1 Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        } catch (err) {
            console.error('ServiceWorker registration failed: ', err);
        }
    }

    // 1. Setup credentials UI and ensure keys are available
    credentials_form.init();
    const creds = await ensure_credentials();

    // 2. Initialize map and location
    const map = await create_map(creds.maptiler_key);
    init_user_location(map);

    // 2.1 Initialize PWA features
    init_pwa_refresh_button();
    await check_stash();

    // 3. Load existing markers from storage
    await sync_map_markers();

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
    events.on('map_drag_or_zoom', () => {
        if (is_context_menu_visible()) {
            hide_context_menu();
        }
    });

    // Handle image selection (processing + upload)
    events.on('image_selected', handle_image_selection);

    // Re-sync markers when signaled by any actions (upload, replace, delete)
    events.on('markers_changed', async () => {
        await sync_map_markers();
        await clear_stash();
    });

    // Handle action selections from context menu
    events.on('action_selected', async (payload) => {
        const { action } = payload;
        
        if (action.type === 'delete_marker') {
            await handle_delete_marker(action.lat, action.lon);
        }
    });
}

// Start application
document.addEventListener('DOMContentLoaded', bootstrap);
