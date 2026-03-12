# FieldMap – Implementation Plan

## 1. Project Structure

Create a modular frontend project using ES modules.

```
/index.html
/css/style.css
/map-style.json

/js/main.js
/js/events.js
/js/location.js
/js/map.js
/js/context_menu.js
/js/image_acquisition.js
/js/image_processing.js
/js/credentials.js
/js/storage_api.js
/js/github_storage.js
/js/marker_loader.js
/js/utils.js
```

Each module performs a single responsibility.

---

# 2. Credentials Handling

The application requires two user-provided credentials:

- GitHub Personal Access Token
- MapTiler API key

These must **not be hard-coded** and must be stored in **localStorage**.

The application uses the **HTML Popover API** for the credentials dialog.

## UI Elements

```
🔑 Keys button (top-right corner)
credentials popover
```

Responsibilities of `credentials.js`:

```
get_credentials()
save_credentials()
populate_inputs_from_local_storage()
```

Startup logic:

```
if GitHub token missing OR MapTiler key missing
    credentials_popover.show_popover()
```

Whenever the popover opens:

```
read values from localStorage
populate inputs
```

---

# 3. Geolocation

Module: `location.js`

Function:

```
get_current_location()
```

Steps:

```
request browser geolocation
wait for response
```

If successful:

```
return {lat, lon}
```

If failed:

```
display "Location unavailable"
abort map initialization
```

---

# 4. Map Initialization

Module: `map.js`

Dependencies:

- MapLibre GL JS
- MapTiler tile API

Function:

```
create_map(center, maptiler_key)
```

Steps:

```
load map-style.json
insert MapTiler API key
initialize MapLibre map
set center
set zoom = 18
```

Add MapLibre GeolocateControl.

Features:

```
display moving location dot
provide "locate me" button
location updates automatically
map does not auto-follow user
```

Expose functions:

```
on_map_click(callback)
on_marker_click(callback)
add_marker(lat, lon)
```

---

# 5. Map Style

File:

```
/map-style.json
(based on approx_style.json)
```

Building visibility improvement:

```
halo outline (white, width 3)
dark outline (width 1)
```

This dual-outline technique improves building visibility on satellite imagery.

---

# 6. Map Interaction

Module: `context_menu.js`

Function:

```
show_context_menu(lat, lon, is_existing_marker)
```

Steps:

```
display small popup at tapped location or marker
```

Menu options:

```
If map tap: "Create photo marker"
If marker tap: "Replace photo"
```

When user selects an action:

```
emit ACTION_SELECTED event
```

---

# 7. Image Acquisition

Module: `image_acquisition.js`

Function:

```
acquire_image()
```

Steps:

```
create hidden file input
accept image/*
trigger click()
```

Mobile browsers allow:

```
camera capture
gallery selection
```

Emit:

```
IMAGE_SELECTED
```

---

# 8. Image Processing

Module: `image_processing.js`

Function:

```
process_image(file)
```

Steps:

```
load image
draw to offscreen canvas
resize to smaller resolution
export compressed JPEG
target size < 100 KB
```

Emit:

```
IMAGE_PROCESSED
```

---

# 9. Storage Abstraction Layer

The application should not depend directly on GitHub.

Instead, a storage abstraction layer is used.

Module:

```
storage_api.js
```

Interface:

```
upload_image(path, blob)
replace_image(lat, lon, blob)
list_images()
```

Current implementation:

```
github_storage.js
```

Future implementations may include:

```
cloudflare_storage.js
s3_storage.js
```

The main application only interacts with `storage_api.js`.

---

# 10. GitHub Storage Implementation

Module:

```
github_storage.js
```

Hardcoded Configuration:
- Owner: `sbachinin`
- Repo: `reference-images-for-map`

Uses GitHub REST API.

Upload request:

```
PUT /repos/sbachinin/reference-images-for-map/contents/{path}
```

Body:

```
{
  message: "add reference photo",
  content: base64
}
```

Authentication:

```
Authorization: Bearer TOKEN
```

Replace image logic (`replace_image`):
1. `GET` the folder contents for the given `lat, lon` to find the existing file and its `sha`.
2. `PUT` to overwrite the file by including the existing `sha` in the request body, or `DELETE` existing and `PUT` new.

Error Handling:

If the upload fails, display a simple alert: "Image upload failed". No offline storage or retry mechanism is implemented.

---

# 11. Location-Based Folder Structure

Images are stored in folders representing coordinates.

Example:

```
photos/
  52.12346_13.45679/
      IMG_3812.jpg
```

Folder name format:

```
latitude_longitude
```

Coordinates rounded to **5 decimals (~1 meter precision)**.

Utility function:

```
generate_storage_path(lat, lon)
```
Generates a unique filename internally using timestamp: `IMG_${Date.now()}.jpg`

Example output:

```
52.12346_13.45679/IMG_1710086400000.jpg
```

GitHub automatically creates missing folders during upload.

---

# 12. Marker Loader (Startup Feature)

On startup the application loads existing markers.

Module:

```
marker_loader.js
```

Uses GitHub Git Trees API (recursive) to handle large file lists efficiently.

Request:

```
GET /repos/sbachinin/reference-images-for-map/git/trees/main?recursive=1
```

Steps:

```
request tree from GitHub API
filter results to use only folders which are immediate children of photos/ folder
parse folder names for coordinates
for each valid folder:
    extract lat/lon
    add marker to map
```

This allows the repository to function as a **spatial database**.

---

# 13. Event System

Module:

```
events.js
```

Functions:

```
emit(event, payload)
on(event, handler)
```

Events used:

```
MAP_TAP
MARKER_TAP
ACTION_SELECTED
IMAGE_SELECTED
IMAGE_PROCESSED
UPLOAD_COMPLETE
```

---

# 14. Application Flow

**State Management (Orchestrator):**
The `main.js` module acts as the orchestrator and holds the state, specifically the `current_active_coordinates`, to ensure state isn't lost during the event flow.

Startup sequence:

```
load credentials
show credentials popover if missing
get geolocation
initialize map
load existing markers
register map and marker click handlers
```

Marker creation/replacement flow:

```
MAP_TAP / MARKER_TAP
    ↓
Set current_active_coordinates in orchestrator (`main.js`)
    ↓
show_context_menu
    ↓
ACTION_SELECTED (Create / Replace photo marker)
    ↓
acquire_image
    ↓
IMAGE_SELECTED
    ↓
process_image
    ↓
IMAGE_PROCESSED
    ↓
Use current_active_coordinates for API call (upload_image / replace_image)
    ↓
UPLOAD_COMPLETE
    ↓
map.add_marker (if new)
```

---

# 15. Minimum UI

```
fullscreen map
🔑 keys button (top right)
credentials popover
context action popup
```

---

# 16. Initial Deliverable

The first working version must allow:

```
open page
enter credentials
detect location
display map
tap location
capture/select photo
compress image
upload to repository
display marker
load existing markers on startup
```
