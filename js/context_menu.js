/**
 * context_menu.js
 * 
 * Manages the UI for the interaction popup overlay (Create vs Replace actions).
 */

import * as events from './events.js';
import { coords_to_folder_name } from './utils.js';
import { load_thumbnail, clear_thumbnail } from './context_menu_thumbnail.js';

const menu_el = document.getElementById('context_menu');
const options_el = document.getElementById('context_menu_options');

function clamp_position(x, y, el, padding = 10) {
    const rect = el.getBoundingClientRect();
    const max_x = window.innerWidth - rect.width - padding;
    const max_y = window.innerHeight - rect.height - padding;

    return {
        x: Math.max(padding, Math.min(x, max_x)),
        y: Math.max(padding, Math.min(y, max_y))
    };
}

function position_menu_at_cursor(x, y) {
    if (!menu_el) return;

    const menu_width = menu_el.offsetWidth;
    const offset_x = -(menu_width / 2);
    const offset_y = 15;

    const clamped = clamp_position(x + offset_x, y + offset_y, menu_el);

    menu_el.style.top = `${clamped.y}px`;
    menu_el.style.left = `${clamped.x}px`;
    menu_el.style.transform = 'none';
}

const click_outside_listener = (e) => {
    if (!is_context_menu_visible()) return;
    if (menu_el.contains(e.target)) return;
    if (e.target.closest('.field-marker')) return;

    e.stopPropagation();
    hide_context_menu();
};

document.addEventListener('click', click_outside_listener, true);

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

/**
 * Decides which options to show in the context menu based on the clicked subject.
 */
function get_context_menu_options(subject) {
    const { lat, lon, click_target } = subject;
    const mobile = is_mobile();
    const options = [];

    if (click_target === 'photo_marker') {
        if (mobile) {
            options.push({
                label: 'Replace photo (via camera)',
                action: { type: 'upload_image', is_replacing: true, image_source: 'camera', lat, lon }
            });
        }
        options.push({
            label: 'Replace photo (via gallery)',
            action: { type: 'upload_image', is_replacing: true, image_source: 'gallery', lat, lon }
        });
        options.push({
            label: 'Delete photo marker',
            action: { type: 'delete_marker', lat, lon }
        });
    } else {
        if (mobile) {
            options.push({
                label: 'Add photo marker (via camera)',
                action: { type: 'upload_image', is_replacing: false, image_source: 'camera', lat, lon }
            });
        }
        options.push({
            label: 'Add photo marker (via gallery)',
            action: { type: 'upload_image', is_replacing: false, image_source: 'gallery', lat, lon }
        });
    }

    return options;
}

/**
 * Main entry point to display the context menu.
 */
export function show_context_menu(subject, x, y) {
    if (!menu_el || !options_el) return;

    // Ensure we start from a clean state
    hide_context_menu();
    options_el.innerHTML = '';

    const { lat, lon, click_target } = subject;

    set_header(lat, lon);

    if (click_target === 'photo_marker') {
        load_thumbnail(lat, lon);
    }

    const options = get_context_menu_options(subject);
    options.forEach(add_menu_item);

    menu_el.classList.add('visible');
    position_menu_at_cursor(x, y);
}

function set_header(lat, lon) {
    const header_el = document.getElementById('menu_header');
    if (header_el) {
        header_el.textContent = coords_to_folder_name(lat, lon);
    }
}

export function hide_context_menu() {
    if (menu_el) {
        menu_el.classList.remove('visible');
        clear_thumbnail();
    }
}

export function is_context_menu_visible() {
    return menu_el && menu_el.classList.contains('visible');
}
