# 12. Reusable Marker Loader Module

## Overview
Extract the "load all markers" functionality into a single, self-contained JavaScript file that can be imported from another website via a CDN URL like:
```
https://cdn.jsdelivr.net/gh/sbachinin/fieldmap@main/js/marker_loader.js
```

## Current Dependency Chain
Loading markers currently touches 4 files:

1. **`load_markers()`** in `js/github/storage.js` → calls `github_request()` and `get_unique_locations_from_tree()`
2. **`github_request()`** in `js/github/client.js` → calls `get_credentials()` and reads `GITHUB_CONFIG`
3. **`get_unique_locations_from_tree()`** and `parse_coords_from_path()` in `js/utils.js`
4. **`GITHUB_CONFIG`** in `js/constants.js`

## Proposed Design

### [NEW] `js/marker_loader.js`

A single exported function:
```javascript
export async function load_markers({ github_token, owner, repo }) { ... }
```

The caller passes in all configuration explicitly (token, owner, repo). The module is fully self-contained with zero imports:
- An inline GitHub API fetch call with auth header, error handling, and cache busting
- `get_unique_locations_from_tree()` and `parse_coords_from_path()` moved here from `utils.js` as private (non-exported) helpers, since they are only used in context of marker loading

### [MODIFY] `js/github/storage.js`
- Remove the current `load_markers()` implementation.
- Import `load_markers` from `../marker_loader.js`.
- Re-export it with credentials and config injected from the existing app modules (`get_credentials`, `GITHUB_CONFIG`).
- Remove `get_unique_locations_from_tree` and `add_cache_buster` from the `utils.js` import since they are no longer used here.

### [MODIFY] `js/utils.js`
- Remove `get_unique_locations_from_tree()` and `parse_coords_from_path()` (moved to `marker_loader.js`).

### No other files change.

## Code Duplication
The only overlap is a small `fetch()` call inside `marker_loader.js` that is similar to `github_request()` in `client.js`. This is unavoidable because they have different auth designs: `marker_loader.js` takes a token as a parameter while `client.js` reads from `localStorage`. All tree-parsing logic is moved (not copied), so there is no duplication there.

## Usage from another website
```html
<script type="module">
    import { load_markers } from 'https://cdn.jsdelivr.net/gh/sbachinin/fieldmap@main/js/marker_loader.js';

    const markers = await load_markers({
        github_token: 'ghp_xxx',
        owner: 'sbachinin',
        repo: 'reference-images-for-map'
    });
    
    console.log(markers); // [{lat: 12.345, lon: 67.890}, ...]
</script>
```
