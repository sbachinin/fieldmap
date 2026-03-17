/**
 * context_menu.js
 * 
 * Manages the UI for the interaction popup overlay (Create vs Replace actions).
 */

import * as events from './events.js';
import { coords_to_folder_name } from './utils.js';
import { update_thumbnail } from './context_menu_thumbnail.js';

const menu_el = document.getElementById('context_menu');
const options_el = document.getElementById('context_menu_options');

function clamp_position(x, y, el, padding = 10) {
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    return {
        x: Math.max(padding, Math.min(x, maxX)),
        y: Math.max(padding, Math.min(y, maxY))
    };
}

function position_menu_at_cursor(x, y) {
    if (!menu_el) return;

    const clamped = clamp_position(x, y, menu_el);

    menu_el.style.top = `${clamped.y}px`;
    menu_el.style.left = `${clamped.x}px`;

    // Remove the static transform as we are now clamping the absolute position
    menu_el.style.transform = 'none';
}

// Create the click outside listener once and reuse it
const click_outside_listener = (e) => {
    // Only handle clicks when menu is visible
    if (!is_context_menu_visible()) return;

    // If they clicked the menu itself, do nothing
    if (menu_el.contains(e.target)) return;

    // If they clicked an existing marker, let the event propagate
    // so map.js can catch it and emit a new 'marker_tap' event to replace this menu
    if (e.target.closest('.field-marker')) return;

    // Otherwise, they clicked the empty map or some other UI element.
    // Stop the click from bleeding through to the map canvas
    // which would accidentally trigger a new map_tap event.
    e.stopPropagation();
    hide_context_menu();
};

// Register the click outside listener once and forever
document.addEventListener('click', click_outside_listener, true);

// Private helper to add a menu item
function add_menu_item({ label, action }) {
    const li = document.createElement('li');
    li.textContent = label;
    li.onclick = () => {
        events.emit('action_selected', { action });
        hide_context_menu();
    };
    options_el.appendChild(li);
}

function is_mobile() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function show_context_menu(subject, x, y) {
    if (!menu_el || !options_el) return;

    // Ensure we clean up any previous state before opening a new one
    hide_context_menu();

    options_el.innerHTML = '';

    const { lat, lon } = subject;

    // Set header with coordinates
    const header_el = document.getElementById('menu_header');
    if (header_el) {
        header_el.textContent = coords_to_folder_name(lat, lon);
    }

    const is_replacing = subject.click_target === 'photo_marker';

    // Update thumbnail in the menu
    update_thumbnail(lat, lon, is_replacing);

    if (is_mobile()) {
        add_menu_item({
            label: is_replacing ? 'Replace photo (via camera)' : 'Add photo marker (via camera)',
            action: { type: 'upload_image', is_replacing, image_source: 'camera', lat, lon }
        });
    }

    add_menu_item({
        label: is_replacing ? 'Replace photo (via gallery)' : 'Add photo marker (via gallery)',
        action: { type: 'upload_image', is_replacing, image_source: 'gallery', lat, lon }
    });

    // Make menu visible first so we can measure it for positioning
    menu_el.classList.add('visible');
    position_menu_at_cursor(x, y);
}

export function hide_context_menu() {
    if (menu_el) {
        menu_el.classList.remove('visible');
        menu_el.classList.remove('existing-marker');
    }
}

export function is_context_menu_visible() {
    return menu_el && menu_el.classList.contains('visible');
}
