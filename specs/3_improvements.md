# Mobile Fixes for Android (Firefox & Chrome)

This plan addresses two issues reported on Android devices.

---

## 1. Firefox Mobile Disabled
Firefox on mobile devices is disabled due to a persistent and difficult-to-solve "white map" issue.

### Decision Rationale
After multiple attempts to fix the "white map" bug (where the map becomes blank after returning from the camera app in Firefox Android), it was decided to restrict the application to other browsers like Chrome. The bug appeared to be related to how Firefox handles WebGL context restoration or layout recalculations after being backgrounded by the camera app, and no reliable workaround was found.

### Implementation
#### [NEW] [browser_check.js](file:///z:/home/sbachinin/projects/fieldmap/js/browser_check.js)
- Detects Firefox on mobile (Android/iOS).
- Displays a blocking message: "This map is unavailable on Firefox because of the problem, which was a white map after taking a picture in the camera. Therefore to avoid problems Firefox is disabled in this app and please use Chrome or anything else."

#### [MODIFY] [index.html](file:///z:/home/sbachinin/projects/fieldmap/index.html)
- Includes the browser check script to block access immediately.

#### [DELETE] [apply_a_fix_for_white_map_after_taking_a_photo.js](file:///z:/home/sbachinin/projects/fieldmap/js/apply_a_fix_for_white_map_after_taking_a_photo.js)
- Removed the previous unsuccessful fix.

---

## 2. Missing Camera in Chrome
The file picker doesn't offer the camera option on some devices.

### Proposed Changes
#### [MODIFY] [image_acquisition.js](file:///z:/home/sbachinin/projects/fieldmap/js/image_acquisition.js)
- Update the `action_selected` handler to accept a new `source` parameter ('camera' or 'gallery').
- Before calling `cameraInput.click()`, set the `capture` attribute to `"environment"` if the source is 'camera', or remove it if the source is 'gallery'.
- This explicitly tells the browser which picker to open, bypassing the inconsistent "Complete action using" dialogs.

#### [MODIFY] [context_menu.js](file:///z:/home/sbachinin/projects/fieldmap/js/context_menu.js)
- Refactor the context menu to provide TWO options instead of one:
    - **Take photo** (Directly opens camera)
    - **Choose from gallery** (Opens photo library)
- This applies to both the "Create" and "Replace" flows.

### Verification Plan
#### Manual Verification (User)
1. **Test Chrome/Android**: Verify that "Take photo" opens the camera app directly and "Choose from gallery" opens the device memory.

