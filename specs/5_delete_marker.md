# Specification: Delete Photo Marker

## Overview
This task describes the implementation of a "Delete Photo Marker" feature. This allows users to completely remove a coordinate marker and its associated photos from the GitHub repository.

## Implementation Plan

### Stage 1: Storage API Extension
1.  **Update `js/github/storage.js`**:
    -   Add `delete_marker(lat, lon)` function.
    -   This function must:
        1. Fetch all files in the `photos/lat_lon` folder.
        2. Attempt to delete each file.
        3. Use `Promise.allSettled` to track the outcome of every individual deletion.
        4. If some succeed but others fail, it should throw a custom "PartialFailure" error or return a status indicating partial success.
2.  **Update `js/storage_api.js`**:
    -   Export the new `delete_marker(lat, lon)` function.

### Stage 2: Context Menu Update
1.  **Update `js/context_menu.js`**:
    -   Add "Delete photo marker" to the context menu when an existing marker is clicked.
    -   Trigger a `delete_marker` action.

### Stage 3: Map UI & Synchronization
1.  **Update `js/map.js`**:
    -   Add `clear_markers()` function to remove all `maplibregl.Marker` instances from the map.
2.  **Global Sync Strategy (`js/main.js`)**:
    -   Implement a `sync_map_markers()` function that:
        1. Calls `map_module.clear_markers()`.
        2. Re-fetches all markers from GitHub.
        3. Re-adds them to the map.
    -   **Refactor `upload_complete`**: Use `sync_map_markers()` instead of surgical adding.
    -   **Implement `delete_marker` handler**:
        1. Call `storage_api.delete_marker()`.
        2. **Regardless of outcome**, call `sync_map_markers()`.
        3. If successful: Show success message.
        4. If partial failure: Show "Deletion partially failed: some files were removed, but others could not be deleted."
        5. If total failure: Show standard error message.

## User Decisions
-   **Confirmation:** None.
-   **Source of Truth:** GitHub.
-   **Partial Failures:** Handled explicitly with a clear message to the user.
-   **Synchronization:** Always "Re-render all" after any modification (Add/Replace/Delete).
