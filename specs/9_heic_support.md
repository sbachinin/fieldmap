# 9. HEIC Image Support

## Problem
Currently, the application allows users to upload photos that are then resized via an HTML `<canvas>` element before being uploaded to GitHub. However, `.heic` and `.heif` images (commonly taken on iOS devices) are not natively supported by the `Image` decoding layer in most Android and desktop browsers. If a user tries to add a HEIC marker on an unsupported device, the canvas processor fails and no image is uploaded.

## Solution
Integrate the open-source `heic2any` library to intercept `.heic` and `.heif` files immediately after user selection. This library uses a WebAssembly port of a C++ decoder to convert the HEIC files into standard `image/jpeg` Blobs locally in the browser. These standardized JPEGs can then be fed directly into the existing canvas resizing pipeline without altering the core upload logic.

## Technical Requirements
- The conversion must happen entirely client-side.
- The conversion must hook into the existing UI loading states (`show_loading`) to inform the user that a conversion is taking place (HEIC decoding can take a couple of seconds on mobile).
- The solution must accommodate `heic2any` occasionally returning an array of blobs (for Live Photos or burst shots) by defaulting to the first image.

## Proposed Implementation Steps

1. **`index.html`**
   - Import the `heic2any` library directly from a CDN just before the application entry point.
   - Example: `<script src="https://unpkg.com/heic2any@0.0.4/dist/heic2any.js"></script>`

2. **`js/image_processing.js`**
   - Update the `handle_image_selection` function.
   - Before passing the `file` to `process_image()`, check its MIME-type (`image/heic` or `image/heif`) and file extension.
   - If it matches, await `heic2any` conversion:
     ```javascript
     const converted = await heic2any({ 
         blob: file, 
         toType: "image/jpeg", 
         quality: 0.8 
     });
     // Handle potential array return
     file = Array.isArray(converted) ? converted[0] : converted;
     ```
   - Proceed with passing the newly formed `file` (which is now a JPEG Blob) to the existing `process_image(file)` function.

## Notes
The `heic2any` conversion process inherently drops EXIF metadata. Since the `process_image` canvas drawing step also strips EXIF metadata per the project's original design, this lack of EXIF preservation aligns perfectly with the current architecture. Marker locations will continue to be derived from the map interaction payload instead of the photo payload.
