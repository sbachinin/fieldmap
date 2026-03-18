/**
 * geolocate_control.js
 * 
 * Helper to initialize the MapLibre geolocate control.
 * 
 * This solves a specific issue in Progressive Web Apps (PWAs): if location services
 * are disabled on a smartphone, MapLibre's default geolocation control may 
 * become permanently disabled and unrecoverable for that session.
 * 
 * This module maintains an infinite "Health Monitor" loop that only runs when
 * the app is visible. It initializes the control UI immediately and then 
 * proactively triggers it once a valid location is confirmed to ensure it 
 * stays active and recovered.
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

        // Initialize the control UI immediately so it exists before hardware location starts.
        // This avoids performing heavy WebGL/DOM work inside the hardware success callback,
        // which can cause freezes on some Android devices.
        if (currentMapInstance && !geolocateControl) {
            console.log('Initializing geolocate control UI.');
            geolocateControl = new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserLocation: true,
                showAccuracyCircle: false,
                fitBoundsOptions: { maxZoom: 18 }
            });
            currentMapInstance.addControl(geolocateControl, 'top-right');
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // SUCCESS: Location is available
                if (retryTimeout) {
                    clearTimeout(retryTimeout);
                    retryTimeout = null;
                }

                // Proactively trigger the control to ensure it recovers from any internal stalls
                console.log('Location confirmed. Proactively triggering geolocate control.');
                try {
                    geolocateControl.trigger();
                } catch (e) {
                    console.warn('Failed to trigger geolocate control:', e);
                }

                // Monitor health every 15 seconds while successful and visible
                retryTimeout = setTimeout(tryInit, 15000);
            },
            (err) => {
                // FAILURE: Location lost or disabled
                console.log(`Location health check status: ${err.message}.`);
                
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
