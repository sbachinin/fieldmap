# Image Cache Busting Strategy

## Problem
GitHub's raw user content CDN (`raw.githubusercontent.com`) employs aggressive caching. When an existing image file is updated (overwritten) at the same path via the GitHub API, the CDN often continues serving the old image for an extended period, even when the underlying repository content has changed. Standard cache-busting query parameters (e.g., `?v=123`) are frequently ignored by this specific CDN.

## Solution: "Delete-and-Create" Pattern
To ensure users always see the most recent photo after a "Replace" action, the application will shift from updating existing files to generating unique filenames for every upload.

### 1. Unique Filenames
Every image upload (whether new or a replacement) must use a unique path. The current `generate_storage_path` utility already includes a timestamp:
`photos/LAT_LON/IMG_TIMESTAMP.jpg`

### 2. Implementation in `replace_image`
Instead of performing a `PUT` request with a `sha` to overwrite an existing file, the `replace_image` operation in `js/github/storage.js` will:
1. **Fetch current files:** List all files in the coordinate-specific folder.
2. **Upload New File:** Upload the new image blob using a freshly generated timestamped path.
3. **Cleanup Old Files:** Delete the previous files identified in step 1 using the `DELETE` method. This order (upload then delete) ensures that if the upload fails, the original photo remains intact.

### 3. Robust Retrieval in `get_image_url`
Since multiple files might briefly exist in a folder during the replacement transition (or due to race conditions), `get_image_url` must be updated to:
1. List all files in the folder.
2. Sort them alphabetically (which, given the `IMG_TIMESTAMP.jpg` format, puts the newest file last).
3. Return the `download_url` of the latest file.

## Benefits
- **Instant Updates:** A new filename generates a completely new URL, bypassing any previous CDN cache.
- **Reliability:** The "Upload before Delete" sequence prevents data loss during the replacement process.
- **Robustness:** Sorting by timestamp ensures the UI always prioritizes the most recent data even if cleanup of old files fails.
