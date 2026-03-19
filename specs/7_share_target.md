# 7. Share Target Implementation

## Objective
Make the Fieldmap PWA a "share target" for mobile devices so users can share an image directly from their gallery or other apps into the app. The shared image will be temporarily "stashed" and can be used to create or replace a marker on the map via the context menu.

## Components and Changes

### 1. Manifest (`manifest.json`)
- Add a `share_target` configuration.
- Set the `action` to a specific route, e.g., `/?share-target`.
- Set the `method` to `POST` and `enctype` to `multipart/form-data`.
- Configure `params` to accept `title`, `text`, and `files` (with `accept: ["image/*"]`).

### 2. Service Worker (`sw.js`)
- Since GitHub Pages is a static host and cannot process `POST` requests, the Service Worker must intercept the `fetch` event for the share target `action` URL.
- When intercepted, the Service Worker will extract the image file from the `formData`.
- The Service Worker will store the image temporarily in IndexedDB and respond with an HTTP 303 redirect to the main app URL (`/` or `./`), or send the image to the main client via `postMessage`.

### 3. Share Stash State (`js/share_stash.js` - New Module)
- A new module to manage the stashed image state.
- Will check IndexedDB on load or listen for incoming `postMessage` from the Service Worker.
- Stores at most one image. If a new image is shared, it replaces the existing one in the stash.
- Provides methods to get, set, and clear the stashed image.

### 4. UI: Stash Indicator (`index.html`, `css/styles.css`, `js/ui.js` or `js/share_stash.js`)
- A small floating UI element positioned in the **top-left corner** of the page.
- Only visible when the stash is not empty.
- Displays a tiny thumbnail of the stashed image.
- Includes a small cross (close) button to discard the stashed image. Clicking the cross clears the stash and hides the indicator.

### 5. Context Menu Integration (`js/context_menu.js`)
- When the context menu is opened (on an existing marker or any other place on the map), query the Share Stash.
- If an image is stashed, add a new menu item: "Use shared image".
- Creating a marker with this option follows the same folder/coordinate generation rules as a regular camera photo.
- Replacing an existing marker with this option works exactly the same as picking a new photo for that marker (uploading the file and deleting the old one).
- Clicking this item will:
  1. Retrieve the stashed image.
  2. Pass it to the image processing/upload flow (acting as the source instead of user file input/camera).
  3. Send the GitHub API request to create or replace the image in the coordinate folder.
  4. On success, clear the stash and hide the UI indicator.
