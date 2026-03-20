# 8. Temporary Marker on Map Tap

## Overview
When a user taps an empty location on the map, the context menu appears to allow adding a new marker. To help the user understand the exact location they tapped, a temporary graphical indicator (a dot) should be placed at the tapped coordinates.

## Visual Design
- The indicator will be implemented as a MapLibre Marker.
- It will be styled as a small square dot: 5x5 pixels.
- The inner area will be white, surrounded by a 1px black border.
- The default shape will be a square (no border radius).

## Lifecycle & State Management
- **Creation**: Triggered when the `map_tap` event fires and the context menu is opened for a target of type `'map'`. The temporary marker is created at the exactly tapped coordinates (latitude and longitude).
- **Removal**: The temporary marker must be removed from the map whenever the context menu is closed. This occurs in the following scenarios:
  - The map is tapped again (which closes the current menu and opens a new one).
  - The map is dragged or zoomed.
  - An action is selected from the context menu.
  - The user clicks outside the context menu.

## Proposed Implementation Steps

1. **`js/map.js`**:
   - Introduce a module-level variable to store the reference to the current temporary marker: `let temp_marker = null;`.
   - Export a new function `add_temporary_marker(lat, lon)`.
     - This function generates the HTML `div` with the required styles (5x5px, white background, black border).
     - It creates a `maplibregl.Marker` with this element, adds it to the `mapInstance`, and assigns it to `temp_marker`.
     - It ensures any existing `temp_marker` is removed before creating a new one.
   - Export a new function `remove_temporary_marker()`.
     - This function calls `remove()` on `temp_marker` (if it exists) and sets it back to `null`.

2. **`js/context_menu.js`**:
   - In `show_context_menu(subject, x, y)`: If the `subject.click_target` is `'map'`, call `map_module.add_temporary_marker(subject.lat, subject.lon)`. Avoid creating one if the user tapped an existing marker (`'photo_marker'`).
   - In `hide_context_menu()`: Call `map_module.remove_temporary_marker()` to guarantee the dot disappears whenever the menu is closed for any reason.
