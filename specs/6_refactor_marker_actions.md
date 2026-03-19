# 6. Refactor Marker Actions

## Goal
Move the image uploading logic from `js/image_processing.js` to `js/marker_actions.js` to better separate concerns.

## Context
Currently, `js/image_processing.js` handles two distinct responsibilities:
1. **Processing:** Compressing images, resizing them, drawing them to a canvas, and stripping EXIF metadata.
2. **Uploading:** Orchestrating the calls to `storage_api` (`replace_image`, `upload_image`), displaying loading and success UI messages, and emitting completion events.

`js/marker_actions.js` on the other hand is intended to be the high-level handler for all user-triggered marker operations. Right now it only contains the logic for `delete_marker`. 

## Implementation Plan

1. **Extract `upload_processed_image`**
   - Move the `upload_processed_image` function from `js/image_processing.js` to `js/marker_actions.js`.
   - Rename it to `handle_upload_processed_image` to establish consistency with the existing `handle_delete_marker` function.
   - Ensure you bring over the required imports (`show_loading`, `show_success`, `show_error`, `storage_api`, `events`, `generate_storage_path`) into `marker_actions.js`.

2. **Update `js/marker_actions.js`**
   ```javascript
   export async function handle_upload_processed_image(blob, action) {
       const { lat, lon, is_replacing } = action;

       show_loading(is_replacing ? "Replacing photo..." : "Uploading photo...");
               
       try {
           if (is_replacing) {
               await storage_api.replace_image(lat, lon, blob);
           } else {
               const path = generate_storage_path(lat, lon);
               await storage_api.upload_image(path, blob);
           }

           show_success("Upload successful!");
           events.emit('upload_complete', { lat, lon, is_replacing });
       } catch (error) {
           show_error(`Failed to save marker: ${error.message}`);
           throw error; // Re-throw so the caller knows it failed
       }
   }
   ```

3. **Update `js/image_processing.js`**
   - Import `handle_upload_processed_image` from `marker_actions.js`.
   - Inside the existing `handle_image_selection` try/catch block, swap out the call to the local `upload_processed_image` with the imported `handle_upload_processed_image`.
