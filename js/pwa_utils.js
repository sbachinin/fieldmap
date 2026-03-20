/**
 * Initializes PWA-specific UI elements, such as a manual refresh button.
 * Only shows the button if the app is running in "standalone" mode.
 */
export function init_pwa_refresh_button() {
    const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    const refreshBtn = document.getElementById('refresh_btn');
    if (!isPWA || !refreshBtn) return;

    refreshBtn.style.display = 'flex';

    refreshBtn.addEventListener('click', async () => {
        // This function wipes the entire app storage layer,
        // which is brutal and ok only for a personal tool
        try {
            // Unregister service workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }

            // Clear caches
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch (err) {
            console.error('PWA reset failed:', err);
        }

        // Force reload (outside try to guarantee execution)
        window.location.href =
            window.location.pathname + '?t=' + Date.now();
    });
}