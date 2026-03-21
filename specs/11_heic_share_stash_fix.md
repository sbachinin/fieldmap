# 11. Fix HEIC Failure in Share Stash

## Problem
When a HEIC image is shared to the PWA via the Web Share Target API, the stash indicator silently fails to appear. The user sees no feedback that a file was shared.

## Root Cause
The `check_stash()` function in `share_stash.js` calls `convert_heic_if_needed()` immediately after retrieving the file from IndexedDB. This fails because:

1. **Lost metadata**: When a `File` object is stored in IndexedDB and retrieved, it may come back as a plain `Blob`, losing its `.name` property. Some Android versions also report HEIC files shared via intents with a generic MIME type (`application/octet-stream` or empty) instead of `image/heic`.
2. **Detection fails**: `convert_heic_if_needed()` checks `.name` and `.type` to decide if the file is HEIC. With both lost/wrong, the file passes through unconverted.
3. **Silent catch**: Whether the detection fails (leaving an unconvertible HEIC blob) or `heic2any` throws, the error is caught by `check_stash()`'s `catch` block, which only logs to console. The stash indicator is never shown.

## Proposed Fix

### 1. Always attempt conversion (`js/image_processing.js`)
Replace the name/type-based HEIC detection with a "try-convert, catch-fallback" approach:

```javascript
export async function convert_heic_if_needed(file) {
    try {
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        return Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
        // Not a HEIC file, or conversion not needed — return original
        return file;
    }
}
```

This eliminates the unreliable metadata checks entirely. If the file is HEIC, `heic2any` converts it. If not, `heic2any` throws quickly and we return the original file unmodified.

### 2. Add a thumbnail fallback (`js/share_stash.js`)
In `show_indicator()`, attach an `onerror` handler to the `<img>` element. If the browser cannot render the stashed file, replace it with a placeholder (e.g. 📷 emoji) so the user always sees confirmation that a file is stashed.

### 3. Remove `show_loading` call from conversion (`js/image_processing.js`)
Since `convert_heic_if_needed` is now a silent try/catch, the `show_loading("Converting HEIC image...")` call should be removed from inside the function. The caller can show loading state if desired.

## Trade-offs
- Every non-HEIC image will briefly be passed through `heic2any` before it throws and falls back. This costs only a few milliseconds and is negligible since conversions happen infrequently (only on share or upload actions).
