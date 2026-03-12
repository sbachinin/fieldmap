/**
 * context_menu.js
 * 
 * Manages the UI for the interaction popup overlay (Create vs Replace actions).
 */

import * as events from './events.js';

const menuEl = document.getElementById('context_menu');
const optionsEl = document.getElementById('context_menu_options');

function position_menu_at_cursor(x, y) {
    if (!menuEl) return;
    
    // Position menu slightly offset from the exact click pixel
    // and override the centered styling from CSS
    menuEl.style.top = `${y}px`;
    menuEl.style.left = `${x}px`;
    
    // Instead of completely centering, anchor to the top-left of the cursor
    menuEl.style.transform = 'translate(10px, 10px)';
}

let _activeClickOutsideListener = null;

export function show_context_menu(lat, lon, is_existing_marker, x, y) {
    if (!menuEl || !optionsEl) return;
    
    // Ensure we clean up any previous listener before opening a new one
    hide_context_menu();

    optionsEl.innerHTML = '';
    
    // Create the main action item
    const actionLi = document.createElement('li');
    
    if (is_existing_marker) {
        actionLi.textContent = 'Replace photo';
        actionLi.className = 'danger';
        actionLi.onclick = () => {
            events.emit('action_selected', { action: 'replace_photo', lat, lon });
            hide_context_menu();
        };
    } else {
        actionLi.textContent = 'Create photo marker';
        actionLi.onclick = () => {
            events.emit('action_selected', { action: 'create_photo', lat, lon });
            hide_context_menu();
        };
    }

    optionsEl.appendChild(actionLi);

    position_menu_at_cursor(x, y);
    menuEl.classList.add('visible');
    
    // Auto-hide when clicking anywhere outside
    _activeClickOutsideListener = (e) => {
        // If they clicked the menu itself, do nothing
        if (menuEl.contains(e.target)) return;

        // If they clicked an existing marker, let the event propagate
        // so map.js can catch it and emit a new 'marker_tap' event to replace this menu
        if (e.target.closest('.field-marker')) return;

        // Otherwise, they clicked the empty map or some other UI element.
        // Stop the click from bleeding through to the map canvas
        // which would accidentally trigger a new map_tap event.
        e.stopPropagation();
        hide_context_menu();
    };
    
    // Use capture phase (true) so the body catches the click BEFORE the map canvas does
    setTimeout(() => {
        document.addEventListener('click', _activeClickOutsideListener, true);
    }, 100);
}

export function hide_context_menu() {
    if (_activeClickOutsideListener) {
        document.removeEventListener('click', _activeClickOutsideListener, true);
        _activeClickOutsideListener = null;
    }
    
    if (menuEl) {
        menuEl.classList.remove('visible');
    }
}

export function is_context_menu_visible() {
    return menuEl && menuEl.classList.contains('visible');
}
