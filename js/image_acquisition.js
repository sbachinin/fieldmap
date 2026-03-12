/**
 * image_acquisition.js
 * 
 * Handles reading from the device camera or gallery using a hidden file input.
 */

import * as events from './events.js';

let current_action_state = null; // { lat, lon }

export function init_image_acquisition() {
    const cameraInput = document.getElementById('camera_input');
    
    // When ACTION_SELECTED is emitted, trigger the hidden file input
    events.on('action_selected', (payload) => {
        // payload: { action: 'create_photo' | 'replace_photo', lat, lon }
        if (payload.action === 'create_photo' || payload.action === 'replace_photo') {
            current_action_state = { lat: payload.lat, lon: payload.lon };
            cameraInput.value = ''; // Reset to ensure change event fires even if same file is selected
            cameraInput.click();
        }
    });

    // Handle file selection from camera/gallery
    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && current_action_state) {
            events.emit('image_selected', { 
                file: file, 
                lat: current_action_state.lat, 
                lon: current_action_state.lon 
            });
        }
        current_action_state = null; // Clear state
    });
}
