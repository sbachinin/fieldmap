/**
 * geolocate_control.js
 * 
 * Helper to initialize the MapLibre geolocate control only after 
 * a valid location has been confirmed.
 * 
 * This solves a specific issue in Progressive Web Apps (PWAs): if location services
 * are disabled on a smartphone, MapLibre's default geolocation control may 
 * become permanently disabled and unrecoverable for that session.
 * 
 * This module maintains an infinite "Health Monitor" loop that only runs when
 * the app is visible. If location is lost (e.g., GPS toggled off mid-session), 
 * it removes the stalled control and retries until location returns, 
 * then re-initializes a fresh control.
 */

let retryTimeout = null;
let geolocateControl = null;
let currentMapInstance = null;
let isListenerAdded = false;

export function setup_geolocate_control(mapInstance) {
    currentMapInstance = mapInstance;
    
    // Prevent multiple parallel retry loops
    if (retryTimeout) return;

    // Listen for visibility changes to resume the loop immediately when the app is opened
    if (!isListenerAdded) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !retryTimeout) {
                console.log('App became visible, resuming location health check.');
                tryInit();
            }
        });
        isListenerAdded = true;
    }

    function tryInit() {
        // Optimization: Do nothing if the app is in the background
        if (document.visibilityState !== 'visible') {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
                retryTimeout = null;
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // SUCCESS: Location is available
                if (retryTimeout) {
                    clearTimeout(retryTimeout);
                    retryTimeout = null;
                }

                // If the control doesn't exist yet, create it
                if (currentMapInstance && !geolocateControl) {
                    console.log('Location acquired! Initializing MapLibre geolocate control.');
                    geolocateControl = new maplibregl.GeolocateControl({
                        positionOptions: { enableHighAccuracy: true },
                        trackUserLocation: true,
                        showUserLocation: true,
                        showAccuracyCircle: false,
                        fitBoundsOptions: { maxZoom: 18 }
                    });
                    currentMapInstance.addControl(geolocateControl, 'top-right');
                }

                // Monitor health every 15 seconds while successful and visible
                retryTimeout = setTimeout(tryInit, 15000);
            },
            (err) => {
                // FAILURE: Location lost or disabled
                console.log(`Location health check failed (${err.message}).`);

                // Remove the stalled control so we can start fresh once location returns
                if (currentMapInstance && geolocateControl) {
                    console.log('Removing stalled geolocate control.');
                    try {
                        currentMapInstance.removeControl(geolocateControl);
                    } catch (e) {
                        console.warn('Failed to remove geolocate control:', e);
                    }
                    geolocateControl = null;
                }

                // Retry every 5s until location is back
                if (retryTimeout) clearTimeout(retryTimeout);
                retryTimeout = setTimeout(tryInit, 5000);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    }

    tryInit();
}
