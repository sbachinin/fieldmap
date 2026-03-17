/**
 * image_acquisition.js
 * 
 * Handles reading from the device camera or gallery using separate hidden file inputs.
 */

import * as events from './events.js';

export function init_image_acquisition() {
    const camera_input = document.getElementById('camera_input');
    const gallery_input = document.getElementById('gallery_input');
    let current_action = null;
    
    // Core handler for file selection (shared by both inputs)
    const handle_file_change = (e) => {
        const file = e.target.files[0];
        if (file && current_action) {
            events.emit('image_selected', { 
                file: file,
                action: current_action
            });
            current_action = null;
        }
    };

    // Register listeners on both inputs
    camera_input.addEventListener('change', handle_file_change);
    gallery_input.addEventListener('change', handle_file_change);

    /**
     * When the user returns to the app (window.focus), if no file was selected,
     * we clear the current_action after a small delay to ensure 'change' had time to fire.
     */
    window.addEventListener('focus', () => {
        setTimeout(() => {
            if (current_action) {
                console.log("File selection cancelled by user. Resetting action state.");
                current_action = null;
            }
        }, 1000); // 1s is usually enough for the 'change' event to propagate first
    });

    // Watch for action selection events
    events.on('action_selected', ({ action }) => {
        // action object: { type: 'upload_image', is_replacing: bool, image_source: 'camera'|'gallery', lat, lon }
        if (action.type === 'upload_image') {
            current_action = action;
            
            if (action.image_source === 'camera') {
                camera_input.value = ''; // Reset
                camera_input.click();
            } else if (action.image_source === 'gallery') {
                gallery_input.value = ''; // Reset
                gallery_input.click();
            }
        }
    });
}
