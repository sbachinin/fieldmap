import { get_map } from './map.js';

let temp_marker = null;

/**
 * Adds a temporary small dot to indicate where the user tapped.
 * @param {number} lat 
 * @param {number} lon 
 */
export function add_temporary_marker(lat, lon) {
    const mapInstance = get_map();

    if (!mapInstance) return;

    remove_temporary_marker();

    const el = document.createElement('div');
    el.className = 'temp-tap-marker';
    el.style.width = '5px';
    el.style.height = '5px';
    el.style.backgroundColor = 'white';
    el.style.border = '1px solid black';
    el.style.boxSizing = 'border-box';

    temp_marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(mapInstance);
}

/**
 * Removes the temporary tap marker if one exists.
 */
export function remove_temporary_marker() {
    if (temp_marker) {
        temp_marker.remove();
        temp_marker = null;
    }
}
