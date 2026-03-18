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

/**
 * Initializes the user location tracking system.
 * @param {Object} map - The MapLibre map instance.
 */
export function init_user_location(map) {
    mapInstance = map;

    // Visibility-aware battery management
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            startTracking();
        } else {
            stopTracking();
        }
    });

    // Start tracking if the app is currently visible
    if (document.visibilityState === 'visible') {
        startTracking();
    }
}

/**
 * Returns the last known user position.
 * @returns {Object|null} { lat, lon } or null if unknown.
 */
export function get_current_user_pos() {
    return currentPos;
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
            // We do not stop the watch on error; we let it continue in the background
            // to recover when GPS becomes available again.
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
