# Specification: Custom Geolocation System

## Overview
This task describes the implementation of a custom, state-less geolocation system to replace the built-in `maplibregl.GeolocateControl`. The goal is to provide a robust user-positioning experience that survives hardware transitions (GPS toggles) and prevents WebGL context loss.

## Implementation Plan

### Stage 1: Removal (MANDATORY SEPARATE STEP)
1.  **Delete:** `js/geolocate_control.js`.
2.  **Update `js/map.js`:**
    -   Remove `setup_geolocate_control` import.
    -   Remove the call to `setup_geolocate_control(mapInstance)`.
3.  **Verify:** The map should load normally with no geolocation UI or background tracking.

### Stage 2: Custom Geolocation Engine
1.  **New Module:** `js/user_location.js`.
2.  **Tracking Strategy:**
    -   Use `navigator.geolocation.watchPosition` for native event-driven updates.
    -   **Battery Management:** Listen for `visibilitychange`. Stop the watch when the app is hidden; restart it when visible.
    -   On successful position:
        -   Update/create a custom "Blue Dot" marker (`maplibregl.Marker`).
        -   Store the latest coordinates in a local variable.
3.  **Blue Dot UI:**
    -   Implement via a custom HTML element and CSS in `css/style.css`.
    -   Appearance: A small solid blue dot (no accuracy circle).
    -   Interaction: `pointer-events: none` (transparent to clicks).

### Stage 3: Target Button UI
1.  **HTML:** Add a button element in `index.html`.
2.  **CSS:**
    -   Match MapLibre's 29x29px control style.
    -   Use a "target" crosshair icon.
    -   Position in top-right, aligned with other UI buttons.
    -   The button remains visually identical regardless of location status.
3.  **Interaction Logic:**
    -   Clicking the button calls `map.flyTo({ center: [lng, lat], zoom: 18 })`.
    -   **Error Handling:** If no location is available when clicked, show a warning via `message_overlay.show_warning("Location not available")`.
    -   **No Auto-Centering:** The map only moves when the button is explicitly clicked.

## User Decisions
-   **Centering:** Manual only. No auto-centering on first fix.
-   **Feedback:** Use `message_overlay` for failures on button click.
-   **Tracking:** `watchPosition` with visibility-based start/stop.
-   **Visuals:** Small blue dot only. No accuracy circle.
