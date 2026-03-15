/**
 * map.js
 * 
 * Initializes the MapLibre GL JS map instance.
 * Handles styling overlays, MapTiler integration, and marker rendering.
 */

import { get_current_location } from './location.js';
import * as events from './events.js';
import { show_warning, show_error } from './message_overlay.js';

let mapInstance = null;

export async function create_map(maptiler_key) {
    let center = [0, 0];
    let zoom = 1;

    try {
        const loc = await get_current_location();
        center = [loc.lon, loc.lat];
        zoom = 18;
    } catch (err) {
        let msg = `Geolocation failed: ${err.message}. `;

        // Fallback to last saved location from localStorage
        const savedLat = localStorage.getItem('fieldmap_last_lat');
        const savedLon = localStorage.getItem('fieldmap_last_lon');
        const savedZoom = localStorage.getItem('fieldmap_last_zoom');

        if (savedLat && savedLon && savedZoom) {
            center = [parseFloat(savedLon), parseFloat(savedLat)];
            zoom = parseFloat(savedZoom);
            msg += "Restoring last viewed location.";
        } else {
            msg += "Defaulting to global view.";
        }
        show_warning(msg);
    }

    // Initialize MapLibre Map
    try {
        mapInstance = new maplibregl.Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/satellite/style.json?key=${maptiler_key}`, // Base satellite
            center: center,
            zoom: zoom,
            attributionControl: false // Completely disabled per requirements
        });

        // Add error handling for map style loading
        mapInstance.on('error', (e) => {
            if (e.error && e.error.message && e.error.message.includes('style')) {
                show_error('Map error: ' + e.error.message);
            }
        });
    } catch (err) {
        console.error('Failed to initialize map:', err);
        show_error('Failed to initialize map. MapTiler API key might be wrong.');
        throw err;
    }

    const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
        showAccuracyCircle: false, // Prevents the large blue circle from intercepting clicks on markers
        fitBoundsOptions: { maxZoom: 18 }
    });

    // Position Geolocation Control explicitly below the floating Keys button
    // which allows the keys button to claim the absolute top right context.
    mapInstance.addControl(geolocateControl, 'top-right');

    mapInstance.on('load', () => {
        geolocateControl.trigger();
        add_vector_overlays();
    });

    // Handle map clicks
    mapInstance.on('click', (e) => {
        events.emit('map_tap', {
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            point: { x: e.point.x, y: e.point.y }
        });
    });

    // Hide context menu when map starts moving/panning
    mapInstance.on('dragstart', () => {
        events.emit('map_drag', {});
    });

    // Save map location on moveend for persistence
    mapInstance.on('moveend', () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        localStorage.setItem('fieldmap_last_lat', center.lat);
        localStorage.setItem('fieldmap_last_lon', center.lng);
        localStorage.setItem('fieldmap_last_zoom', zoom);
    });

    // Handle visibility changes (e.g., returning from camera app)
    // to fix "white map" issue on some mobile browsers.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && mapInstance) {
            mapInstance.resize();
        }
    });

    return mapInstance;
}

export function reload_map_style(maptiler_key) {
    if (!mapInstance) return;
    
    try {
        mapInstance.setStyle(`https://api.maptiler.com/maps/satellite/style.json?key=${maptiler_key}`);
    } catch (err) {
        show_error('Failed to reload map style. Check your MapTiler API key.');
    }
}

export function add_marker(lat, lon) {
    if (!mapInstance) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'field-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.backgroundColor = '#f97316'; // Consistent orange across all markers
    el.style.border = '3px solid white';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

    // Handle tapping on the marker
    el.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents mapInstance.on('click') from firing as well

        // Pass bounding rect position so context menu can spawn near the marker
        const rect = el.getBoundingClientRect();
        events.emit('marker_tap', {
            lat,
            lon,
            point: { x: rect.left + 10, y: rect.top + 10 }
        });
    });

    new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(mapInstance);
}

/**
 * Renders multiple markers on the map at once.
 * @param {Array<{lat: number, lon: number}>} locations
 */
export function add_markers(locations) {
    if (!locations || !Array.isArray(locations)) return;
    locations.forEach(loc => add_marker(loc.lat, loc.lon));
}

// Private helper — injected on initial load
function add_vector_overlays() {
    try {
        mapInstance.addLayer({
            'id': 'building-halo',
            'type': 'line',
            'source': 'maptiler_planet',
            'source-layer': 'building',
            'paint': { 'line-color': '#ffffff', 'line-width': 3, 'line-opacity': 0.8 }
        });
        mapInstance.addLayer({
            'id': 'building-outline',
            'type': 'line',
            'source': 'maptiler_planet',
            'source-layer': 'building',
            'paint': { 'line-color': '#000000', 'line-width': 1, 'line-opacity': 0.9 }
        });
        mapInstance.addLayer({
            'id': 'building-fill',
            'type': 'fill',
            'source': 'maptiler_planet',
            'source-layer': 'building',
            'paint': { 'fill-color': 'rgba(0, 0, 0, 0.2)' }
        });
        mapInstance.addLayer({
            'id': 'road-casing',
            'type': 'line',
            'source': 'maptiler_planet',
            'source-layer': 'transportation',
            'paint': { 'line-color': '#000000', 'line-width': 4, 'line-opacity': 0.6 }
        });
        mapInstance.addLayer({
            'id': 'road-inner',
            'type': 'line',
            'source': 'maptiler_planet',
            'source-layer': 'transportation',
            'paint': { 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.7 }
        });
    } catch (e) {
        console.error('Failed to inject vector overlay layers:', e);
    }
}
