/**
 * credentials.js
 * 
 * Manages GitHub and MapTiler credentials using localStorage.
 * Controls the HTML Popover API for the credentials dialog.
 */


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

export function setup_credentials_ui() {
    const popover = document.getElementById('credentials_popover');
    const saveBtn = document.getElementById('save_credentials_btn');

    // Populate inputs once on initialization
    populate_inputs_from_local_storage();

    // Handle Enter key to save credentials
    popover.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && popover.matches(':popover-open')) {
            e.preventDefault(); // Prevent default form submission behavior that interferes with popover closing
            submit_credentials();
        }
    });

    // Save button click
    saveBtn.addEventListener('click', submit_credentials);
}

function submit_credentials() {
    const ghToken = document.getElementById('github_token').value.trim();
    const mtKey = document.getElementById('maptiler_key').value.trim();

    if (!ghToken || !mtKey) return;

    save_credentials(ghToken, mtKey);

    // Refresh the page to apply new credentials globally
    location.reload();
}

/**
 * Ensures credentials exist before proceeding.
 * If credentials exist, resolves immediately.
 * Otherwise, shows the popover and returns a pending Promise.
 */
export function ensure_credentials() {
    const creds = get_credentials();

    if (creds.github_token && creds.maptiler_key) {
        return Promise.resolve(creds);
    }

    // Show popover and stay pending (blocking bootstrap until reload)
    document.getElementById('credentials_popover').showPopover();
    return new Promise(() => { }); // Never resolves, bootstrap remains stalled
}
