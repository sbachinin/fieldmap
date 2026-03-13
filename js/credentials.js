/**
 * credentials.js
 * 
 * Manages GitHub and MapTiler credentials using localStorage.
 * Controls the HTML Popover API for the credentials dialog.
 */

import * as events from './events.js';

export function get_credentials() {
    return {
        github_token: localStorage.getItem('fieldmap_github_token') || '',
        maptiler_key: localStorage.getItem('fieldmap_maptiler_key') || ''
    };
}

export function save_credentials(github_token, maptiler_key) {
    if (github_token) localStorage.setItem('fieldmap_github_token', github_token);
    if (maptiler_key) localStorage.setItem('fieldmap_maptiler_key', maptiler_key);
}

export function populate_inputs_from_local_storage() {
    const creds = get_credentials();
    const ghInput = document.getElementById('github_token');
    const mtInput = document.getElementById('maptiler_key');
    if (ghInput) ghInput.value = creds.github_token;
    if (mtInput) mtInput.value = creds.maptiler_key;
}

export function init_credentials() {
    return new Promise((resolve) => {
        const popover = document.getElementById('credentials_popover');
        const saveBtn = document.getElementById('save_credentials_btn');

        // Populate inputs whenever the popover opens
        popover.addEventListener('toggle', (event) => {
            if (event.newState === 'open') {
                populate_inputs_from_local_storage();
            }
        });

        // Handle Enter key to save credentials
        popover.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && popover.matches(':popover-open')) {
                e.preventDefault(); // Prevent default form submission behavior that interferes with popover closing
                submitCredentials();
            }
        });

        function submitCredentials() {
            const ghToken = document.getElementById('github_token').value.trim();
            const mtKey = document.getElementById('maptiler_key').value.trim();

            if (!ghToken || !mtKey) return;

            save_credentials(ghToken, mtKey);
            
            // Refresh the page to apply new credentials globally
            location.reload();
        }

        // Save button always works: persist to localStorage, close popover, notify listeners
        saveBtn.addEventListener('click', submitCredentials);

        // If credentials are already available, resolve immediately
        const creds = get_credentials();
        if (creds.github_token && creds.maptiler_key) {
            resolve(creds);
        } else {
            // Otherwise show the popover and wait for the user to save for the first time
            popover.showPopover();
        }
    });
}
