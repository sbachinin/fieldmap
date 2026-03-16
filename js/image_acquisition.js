/**
 * image_acquisition.js
 * 
 * Handles reading from the device camera or gallery using separate hidden file inputs.
 */

import * as events from './events.js';

export function init_image_acquisition() {
    const camera_input = document.getElementById('camera_input');
    const gallery_input = document.getElementById('gallery_input');
    let current_subject = null;
    
    // Core handler for file selection (shared by both inputs)
    const handle_file_change = (e) => {
        const file = e.target.files[0];
        if (file && current_subject) {
            events.emit('image_selected', { 
                file: file,
                subject: current_subject
            });
            current_subject = null;
        }
    };

    // Register listeners on both inputs
    camera_input.addEventListener('change', handle_file_change);
    gallery_input.addEventListener('change', handle_file_change);

    // Watch for action selection events
    events.on('action_selected', ({ action, subject }) => {
        // action: "create photo via camera" | "replace photo via gallery" | etc.
        if (action.includes('photo')) {
            current_subject = subject;
            
            if (action.includes('via camera')) {
                camera_input.value = ''; // Reset
                camera_input.click();
            } else if (action.includes('via gallery')) {
                gallery_input.value = ''; // Reset
                gallery_input.click();
            }
        }
    });
}
