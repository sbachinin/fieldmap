/**
 * image_acquisition.js
 * 
 * Handles reading from the device camera or gallery using separate hidden file inputs.
 */

import * as events from './events.js';
import { get_stashed_file } from './share_stash.js';

export function init_image_acquisition() {
    const camera_input = document.getElementById('camera_input')
    const gallery_input = document.getElementById('gallery_input')

    let current_action = null

    // --- Low-level: open file picker ---
    function open_picker(source) {
        if (source === 'stash') {
            const file = get_stashed_file();
            if (file) {
                events.emit('image_selected', {
                    file,
                    action: current_action
                });
                current_action = null;
            }
            return;
        }
        const input = source === 'camera' ? camera_input : gallery_input
        input.value = '' // reset so same file can be selected again
        input.click()
    }

    // --- Low-level: extract file from input event ---
    function get_file_from_event(e) {
        return e.target.files && e.target.files[0]
    }

    // --- Core: handle successful file selection ---
    function handle_file_selected(file) {
        if (!file || !current_action) return

        events.emit('image_selected', {
            file,
            action: current_action
        })

        current_action = null
    }

    // --- Core: handle cancellation (no file selected) ---
    function handle_possible_cancel() {
        if (!current_action) return

        console.log('File selection cancelled by user. Resetting action state.')
        current_action = null
    }

    // --- Wire inputs ---
    function on_input_change(e) {
        const file = get_file_from_event(e)
        handle_file_selected(file)
    }

    camera_input.addEventListener('change', on_input_change)
    gallery_input.addEventListener('change', on_input_change)

    // --- Handle "user came back without selecting a file" ---
    window.addEventListener('focus', () => {
        // Delay to allow 'change' event to fire first if it will
        setTimeout(handle_possible_cancel, 1000)
    })

    // --- React to higher-level action ---
    events.on('action_selected', ({ action }) => {
        if (action.type !== 'upload_image') return

        current_action = action
        open_picker(action.image_source)
    })
}