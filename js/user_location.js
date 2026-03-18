/**
 * user_location.js
 * 
 * Manages custom user position tracking with a "Blue Dot" marker.
 * This implementation is designed to be battery-efficient and robust
 * across mobile hardware transitions.
 */

import { show_warning } from './message_overlay.js';

let userMarker = null;
let currentPos = null;
let watchId = null;
let mapInstance = null;
let isListenerAdded = false;

/**
 * Initializes the user location tracking system.
 * @param {Object} map - The MapLibre map instance.
 */
export function init_user_location(map) {
    mapInstance = map;

    // Set up button click listener
    const geolocateBtn = document.getElementById('geolocate_btn');
    if (geolocateBtn) {
        geolocateBtn.addEventListener('click', async () => {
            if (geolocateBtn.classList.contains('loading')) return;
            
            geolocateBtn.classList.add('loading');
            const pos = await retrieve_position();
            geolocateBtn.classList.remove('loading');

            if (pos) {
                // Update internal state and UI
                currentPos = pos;
                updateMarker(pos.lat, pos.lon);

                mapInstance.easeTo({
                    center: [pos.lon, pos.lat],
                    zoom: 18,
                    essential: true
                });
            } else {
                show_warning("Actual location cannot be retrieved at the moment.");
            }
        });
    }

    // Visibility-aware battery management
    if (!isListenerAdded) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                startTracking();
            } else {
                stopTracking();
            }
        });
        isListenerAdded = true;
    }

    // Start tracking if the app is currently visible
    if (document.visibilityState === 'visible') {
        startTracking();
    }
}

/**
 * High-reliability position retrieval.
 * Returns existing pos if available, or triggers a fresh check.
 * This function only resolves null if the 10s timeout is reached,
 * ignoring intermediate hardware errors.
 * @returns {Promise<Object|null>} { lat, lon } or null if timeout reached.
 */
export async function retrieve_position() {
    if (currentPos) return currentPos;

    return new Promise((resolve) => {
        let hasResolved = false;

        // Force a resolution after 10 seconds if no success occurs
        const timeoutId = setTimeout(() => {
            if (!hasResolved) {
                console.warn("Position retrieval timed out after 10s.");
                hasResolved = true;
                resolve(null);
            }
        }, 10000);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (hasResolved) return;
                hasResolved = true;
                clearTimeout(timeoutId);

                const { latitude: lat, longitude: lon } = pos.coords;
                resolve({ lat, lon });
            },
            (err) => {
                // We do NOT resolve null here. We ignore the error and wait
                // to see if the success callback fires or the 10s timeout hits.
                // This could be optimized, failing immediately on certain non-recoverable errors,
                // to avoid unnecessary waiting, but for now we keep it simple.
                console.warn(`Internal hardware error during retrieval (ignored): ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

function startTracking() {
    if (watchId) return;

    console.log("Starting user location tracking...");
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            currentPos = { lat, lon };

            updateMarker(lat, lon);
        },
        (err) => {
            console.warn(`User location tracking error: ${err.message}`);
            // Invalidate current position so we don't show stale data
            currentPos = null;
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
        }
    );
}

function stopTracking() {
    if (watchId) {
        console.log("Stopping user location tracking (app backgrounded).");
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

function updateMarker(lat, lon) {
    if (!mapInstance) return;

    if (!userMarker) {
        // Create the blue dot marker
        const el = document.createElement('div');
        el.className = 'user-location-dot';

        userMarker = new maplibregl.Marker({
            element: el,
            pitchAlignment: 'map',
            rotationAlignment: 'map'
        })
        .setLngLat([lon, lat])
        .addTo(mapInstance);
    } else {
        // Update existing marker position
        userMarker.setLngLat([lon, lat]);
    }
}
