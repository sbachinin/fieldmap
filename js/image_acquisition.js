/**
 * image_acquisition.js
 * 
 * Handles reading from the device camera or gallery using a hidden file input.
 */

import * as events from './events.js';

export function init_image_acquisition() {
    const cameraInput = document.getElementById('camera_input');
    let currentSubject = null;
    
    // When ACTION_SELECTED is emitted, trigger the hidden file input
    events.on('action_selected', ({ action, subject }) => {
        // action: 'create_photo' | 'replace_photo'
        if (action === 'create_photo' || action === 'replace_photo') {
            currentSubject = subject;
            cameraInput.value = ''; // Reset to ensure change event fires even if same file is selected
            cameraInput.click();
        }
    });

    // Handle file selection from camera/gallery
    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && currentSubject) {
            events.emit('image_selected', { 
                file: file,
                subject: currentSubject
            });
            currentSubject = null;
        }
    });
}
