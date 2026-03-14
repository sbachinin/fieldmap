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


let formEl, githubInput, maptilerInput;

export const credentials_form = {
    init() {
        formEl = document.getElementById('credentials_form');
        githubInput = document.getElementById('github_token');
        maptilerInput = document.getElementById('maptiler_key');

        // Populate inputs once on initialization
        this.fill();

        // Toggle full-screen visibility
        document.getElementById('keys_btn').addEventListener('click', () => {
            this.toggle();
        });

        // Handle Enter key to save credentials
        formEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.is_visible()) {
                e.preventDefault(); // Prevent default form submission behavior that interferes with element closing
                this.submit();
            }
        });

        // Save button click
        document.getElementById('save_credentials_btn').addEventListener('click', () => {
            this.submit();
        });

        // Close button click
        document.getElementById('close_credentials_btn').addEventListener('click', () => {
            this.close();
        });
    },

    fill() {
        const creds = get_credentials();
        if (githubInput) githubInput.value = creds.github_token;
        if (maptilerInput) maptilerInput.value = creds.maptiler_key;
    },

    open() {
        formEl.classList.add('visible');
    },

    close() {
        formEl.classList.remove('visible');
    },

    is_visible() {
        return formEl.classList.contains('visible');
    },

    toggle() {
        formEl.classList.toggle('visible');
    },

    submit() {
        const ghToken = githubInput.value.trim();
        const mtKey = maptilerInput.value.trim();

        if (!ghToken || !mtKey) return;

        save_credentials(ghToken, mtKey);

        // Refresh the page to apply new credentials globally
        location.reload();
    }
};

/**
 * Ensures credentials exist before proceeding.
 * If credentials exist, resolves immediately.
 * Otherwise, shows the full-screen interface and returns a pending Promise.
 */
export function ensure_credentials() {
    const creds = get_credentials();

    if (creds.github_token && creds.maptiler_key) {
        return Promise.resolve(creds);
    }

    // Show full-screen UI and stay pending (blocking bootstrap until reload)
    credentials_form.open();
    return new Promise(() => { }); // Never resolves, bootstrap remains stalled
}
