# Implementation Detail: Custom Geolocation Control

## Overview
This document describes the technical implementation of the custom geolocation system, which replaces the default `maplibregl.GeolocateControl`. 

The system is designed for **maximum reliability in Progressive Web Apps (PWAs)** and avoids the WebGL/DOM deadlock issues observed on Android Chrome during hardware GPS transitions.

## Architecture

### 1. The Passive Observer (`watchPosition`)
- The system uses `navigator.geolocation.watchPosition` to listen for native OS location updates.
- **Battery Management:** To preserve battery, the observer is only active when the app is in the foreground. We listen for `visibilitychange` events to `startTracking()` and `stopTracking()` dynamically.
- **Visuals:** Updates a custom "Blue Dot" (`maplibregl.Marker`) on the map.
- **Graceful Invalidation:** If an error occurs (e.g., GPS turned off), the system invalidates the `currentPos` state so the user is not misled by stale data, though the marker remains visible at its last known position.

### 2. The Manual Trigger (`getCurrentPosition`)
- The "Target" button in the top-right UI provides a manual "Center on Location" action.
- **Logic:**
    - If a fresh `currentPos` from the passive observer is already available, the map moves immediately (`easeTo`).
    - If no position is known, it triggers a "One-Shot" `navigator.geolocation.getCurrentPosition` request.
- **The "Silence" Strategy:** To avoid inconsistent UI jitter, hardware errors during the manual check are ignored for the first 10 seconds. We only conclude failure if the 10-second timeout is reached without a success callback.

### 3. UI States
- **Loading:** The target button shows a CSS spinner while a manual location fix is being sought.
- **Feedback:** Uses the project's standard `message_overlay` to notify the user only if the 10-second timeout is hit.

## Future Improvements (To-Do)

### Visual Stale State Indicator
Currently, the blue dot remains at its last known position even if location services are lost. While `currentPos` is invalidated (preventing the "Center" button from using it), the visual marker doesn't reflect this "stale" state.

**Suggested Improvement:**
- When an error callback is received from the Geolocation API, change the blue dot's CSS class to `.user-location-stale`.
- Update `style.css` to make the stale dot look pale (e.g., `opacity: 0.5`) or red to indicate that the information is outdated.
- Revert to the solid blue state as soon as a success callback is received.
