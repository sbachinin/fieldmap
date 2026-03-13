/**
 * context_menu.js
 * 
 * Manages the UI for the interaction popup overlay (Create vs Replace actions).
 */

import * as events from './events.js';

const menu_el = document.getElementById('context_menu');
const options_el = document.getElementById('context_menu_options');

function position_menu_at_cursor(x, y) {
    if (!menu_el) return;
    
    // Position menu slightly offset from the exact click pixel
    // and override the centered styling from CSS
    menu_el.style.top = `${y}px`;
    menu_el.style.left = `${x}px`;
    
    // Instead of completely centering, anchor to the top-left of the cursor
    menu_el.style.transform = 'translate(10px, 10px)';
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

export function show_context_menu(lat, lon, is_existing_marker, x, y) {
    if (!menu_el || !options_el) return;
    
    // Ensure we clean up any previous state before opening a new one
    hide_context_menu();

    options_el.innerHTML = '';
    
    // Create the main action item
    const action_li = document.createElement('li');
    
    if (is_existing_marker) {
        action_li.textContent = 'Replace photo';
        action_li.className = 'danger';
        action_li.onclick = () => {
            events.emit('action_selected', { action: 'replace_photo', lat, lon });
            hide_context_menu();
        };
    } else {
        action_li.textContent = 'Create photo marker';
        action_li.onclick = () => {
            events.emit('action_selected', { action: 'create_photo', lat, lon });
            hide_context_menu();
        };
    }

    options_el.appendChild(action_li);

    position_menu_at_cursor(x, y);
    menu_el.classList.add('visible');
}

export function hide_context_menu() {
    if (menu_el) {
        menu_el.classList.remove('visible');
    }
}

export function is_context_menu_visible() {
    return menu_el && menu_el.classList.contains('visible');
}
