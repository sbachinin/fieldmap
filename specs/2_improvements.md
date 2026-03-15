# Additional Improvements Spec (Part 2)

## 1. Defensive Image Replacement
- **Requirement**: If the `replace_image` operation detects more than one file in the target coordinate folder (`photos/LAT_LON/`), it must fail.
- **Action**:
    - Abort the upload.
    - Show an error/warning message stating that multiple files exist and it indicates an architectural problem.
- **Rationale**: Prevent non-deterministic overwriting and maintain data integrity.

## 2. Geolocation Persistence & Fallback
- **Requirement**: The application should remember the last viewed location if geolocation is unavailable.
- **Persistence**:
    - Listen for the `moveend` event on the map.
    - Save the current center coordinates (lat, lon) and zoom level to `localStorage`.
- **Fallback Logic**:
    - On application load, attempt to get browser geolocation.
    - If geolocation fails (permission denied, timeout, etc.):
        - Check `localStorage` for `fieldmap_last_lat`, `fieldmap_last_lon`, and `fieldmap_last_zoom`.
        - If found, initialize the map at those coordinates.
        - If not found, default to global view `[0, 0]` zoom 1.
