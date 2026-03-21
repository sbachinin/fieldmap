# 10. Google Maps Street View Integration

## Overview
To provide better on-the-ground context while mapping, users should be able to open Google Maps directly in Street View from the "Add / Replace Marker" context menu. 

## Visual Design
- The link will appear as a 🗺️ emoji (or similar icon) placed inside the context menu heading (`#menu_header`).
- It will be positioned to the right of the existing latitude/longitude coordinate text.

## Technical Details
- **Location:** `js/context_menu.js` -> `set_header(lat, lon)`
- **Behavior:** The button will be an `<a>` tag with `target="_blank"` and `rel="noopener noreferrer"`.
- **URL API:** We will use the official Google Maps Intents/URLs API to force Street View mode at the exact coordinates.
  - Format: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`
  - Note: Using this specific `map_action=pano` parameter signals modern mobile devices to deep-link directly into the Google Maps app's Street View interface (provided Street View imagery exists at those coordinates).

## Implementation Steps
1. **CSS Structural Update:** Modify `.menu-header` in `css/style.css` to use `display: flex; justify-content: space-between; align-items: center;`. This ensures the coordinates and the map icon stay perfectly aligned on opposite sides of the header.
2. **DOM Injection:** In `set_header(lat, lon)`, clear the existing text content and append two elements instead:
   - A `<span>` containing the format `coords_to_folder_name(lat, lon)`.
   - An `<a>` element containing the Google Maps link and icon styling.
