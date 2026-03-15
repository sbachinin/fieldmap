# Mobile Fixes for Android (Firefox & Chrome)

This plan addresses two issues reported on Android devices:
1.  **White Map in Firefox**: The map fails to render correctly after returning from the camera app.
2.  **Missing Camera in Chrome**: The file picker doesn't offer the camera option on some devices.

## Proposed Changes

### Map Management
#### [MODIFY] [map.js](file:///z:/home/sbachinin/projects/fieldmap/js/map.js)
-   Add a `visibilitychange` event listener to the document.
-   When the page becomes visible, call `mapInstance.resize()` to ensure the canvas is correctly sized and repainted. This is a common fix for WebGL containers losing context or state on mobile background/foreground transitions.

### Image Acquisition
#### [MODIFY] [image_acquisition.js](file:///z:/home/sbachinin/projects/fieldmap/js/image_acquisition.js)
-   Update the `action_selected` handler to accept a new `source` parameter ('camera' or 'gallery').
-   Before calling `cameraInput.click()`, set the `capture` attribute to `"environment"` if the source is 'camera', or remove it if the source is 'gallery'.
-   This explicitly tells the browser which picker to open, bypassing the inconsistent "Complete action using" dialogs.

#### [MODIFY] [context_menu.js](file:///z:/home/sbachinin/projects/fieldmap/js/context_menu.js)
-   Refactor the context menu to provide TWO options instead of one:
    -   **Take photo** (Directly opens camera)
    -   **Choose from gallery** (Opens photo library)
-   This applies to both the "Create" and "Replace" flows.

## Verification Plan

### Manual Verification (User)
Since I don't have access to an Android Samsung S22, I will need the user to verify the fixes:
1.  **Test Firefox/Android**: Use the "Take photo" option, take a picture, and return to the app. Verify that the map is visible (not white) and the upload completes.
2.  **Test Chrome/Android**: Verify that "Take photo" opens the camera app directly and "Choose from gallery" opens the device memory.
