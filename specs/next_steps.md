# Next Steps

## Image Processing Improvements

### HEIC File Support
- **@image-processing.js needs to handle HEIC files properly**
- At minimum, it is necessary to try uploading a picture taken on iPhone 8
- HEIC (High Efficiency Image Container) is the default format for newer iPhones
- Current implementation may not support this format, causing upload failures
- For HEIC files, in case resizing doesn't work in the current implementation, I can just skip resizing and upload it as is

### GitHub API Caching (Markers)
The `load_markers` function in `js/github/storage.js` currently uses the Git Trees API (`git/trees/main?recursive=1`). This endpoint is heavily cached by GitHub. After adding or deleting a marker, the re-sync may sometimes fetch a stale tree, causing markers to appear/disappear incorrectly until a hard refresh.
- **Goal:** Add a cache-busting mechanism (like a `?t=timestamp` parameter or switching to a more dynamic fetch method) to `load_markers`.

## Performance & Scalability

### GeoJSON-based Marker Rendering
Currently, markers are rendered using the MapLibre Marker API, which creates a separate DOM element for every marker. While sufficient for small sets, this approach does not scale well as the number of markers grows into the thousands.
- **Problem:** `addMarker` creates DOM nodes for all markers regardless of whether they are within the current map bounds. This increases memory overhead and degrades interaction performance.
- **Solution:** Transition to rendering markers via a GeoJSON source and a Symbol/Circle style layer.
- **Benefits:** This provides a "lazy" loading mechanism where the map engine handles rendering and culling efficiently without flooding the DOM.
- **Urgency:** Low, but recommended if the marker count begins to impact performance or navigation smoothness.

