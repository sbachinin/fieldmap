# Architecture Decision: Custom Geolocation Control

## Context
The application initially used the built-in `maplibregl.GeolocateControl`. However, this led to several critical issues in the context of a Progressive Web App (PWA) on mobile devices.

## The Problem
1. **Unrecoverable Stalls:** If location services were disabled or permission was denied during the initial page load, the MapLibre control would enter a "disabled" state that was often impossible to recover within the same session, even if the user later enabled GPS.
2. **Android Chrome Crashes (WebGL):** Attempts to fix the stall by manually removing and re-initializing the control via a retry loop caused severe stability issues on Android Chrome. Specifically:
   - The map would "freeze" (pan/zoom became unresponsive).
   - The map would turn entirely white, indicating a WebGL context loss or a deadlock between the DOM and the hardware abstraction layer during GPS hardware transitions.
3. **Complexity:** The built-in control maintains internal state (tracking, heading, etc.) that conflicts with our need for a simple, robust "Health Monitor" that works across unreliable hardware states.

## Decision
We will remove the `maplibregl.GeolocateControl` entirely and implement a "Manual Geolocation" system.

## Proposed Solution
- **Passive Tracking:** Use a custom `setInterval` or `watchPosition` loop that operates independently of MapLibre's internal state.
- **Custom UI:** A simple HTML/CSS button that looks like the standard "target" icon but has no internal state—it simply triggers a `map.flyTo` when clicked (if a location is known).
- **Custom Marker:** A standard `maplibregl.Marker` with a custom CSS "Blue Dot" element to represent the user's position.
- **Visibility Aware:** The tracking loop must respect `document.visibilityState` to preserve battery.
