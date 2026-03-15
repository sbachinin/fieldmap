/**
 * apply_a_fix_for_white_map_after_taking_a_photo.js
 * 
 * Provides a robust refresh strategy to handle Firefox Android's behavior 
 * when returning from the camera app, which otherwise often results in a white/blank map.
 * 
 * @param {maplibregl.Map} mapInstance The MapLibre map instance to fix.
 */
export function apply_a_fix_for_white_map_after_taking_a_photo(mapInstance) {
    if (!mapInstance) return;

    const robust_refresh = () => {
        // Small delay ensures the browser has finished layout transitions
        // before we ask MapLibre to recalculate its container size.
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.resize();
            }
        }, 100);
    };

    // Listen to multiple signals that indicate the app has returned to focus
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') robust_refresh();
    });
    window.addEventListener('pageshow', robust_refresh);
    window.addEventListener('focus', robust_refresh);
}
