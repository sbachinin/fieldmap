# OpenFreeMap Migration Spec

## Goal
Switch vector map data (buildings, roads) from MapTiler to OpenFreeMap, keeping MapTiler for satellite imagery only.

## OpenFreeMap endpoints

| Purpose | URL |
|---|---|
| TileJSON | `https://tiles.openfreemap.org/planet` |
| Tile template | `https://tiles.openfreemap.org/planet/{version}/{z}/{x}/{y}.pbf` |

No API key or registration required. Uses the OpenMapTiles schema — same source-layer names (`building`, `transportation`, etc.) we already use.

## Changes to `js/map.js`

### 1. Use an inline raster-only style

Replace the MapTiler style URL with an inline style containing **only** the raster satellite source. This avoids loading MapTiler's bundled vector layers entirely.

```js
style: {
    version: 8,
    sources: {
        'satellite': {
            type: 'raster',
            tiles: [
                `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${maptiler_key}`
            ],
            tileSize: 512,
            maxzoom: 20
        }
    },
    layers: [
        { id: 'satellite-layer', type: 'raster', source: 'satellite' }
    ]
}
```

> **Note**: Verify the exact MapTiler raster tile URL (`satellite-v2` vs `satellite`) by inspecting the current satellite style.json.

### 2. Add OpenFreeMap vector source on load

In the `on('load')` handler, add the source before calling `add_vector_overlays()`:

```js
mapInstance.on('load', () => {
    mapInstance.addSource('openmaptiles', {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet'
    });
    add_vector_overlays();
});
```

### 3. Update source references in `add_vector_overlays()`

Change `source: 'maptiler_planet'` → `source: 'openmaptiles'` in all five layers: `building-halo`, `building-outline`, `building-fill`, `road-casing`, `road-inner`.

### 4. Update `reload_map_style()`

After `setStyle()`, re-add the OpenFreeMap source and overlays on `style.load`:

```js
export function reload_map_style(maptiler_key) {
    if (!mapInstance) return;
    try {
        mapInstance.setStyle({ /* same inline raster-only style from step 1 */ });
        mapInstance.once('style.load', () => {
            mapInstance.addSource('openmaptiles', {
                type: 'vector',
                url: 'https://tiles.openfreemap.org/planet'
            });
            add_vector_overlays();
        });
    } catch (err) {
        show_error('Failed to reload map style.');
    }
}
```

## Verification
1. Satellite imagery loads normally
2. Buildings and roads overlay at sufficient zoom
3. Network tab: `.pbf` requests go to `tiles.openfreemap.org`, not `api.maptiler.com`
4. `reload_map_style()` re-applies overlays correctly
