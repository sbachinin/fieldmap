# FieldMap – Iterative Improvements

## 1. UI Adjustments
- **Keys Button:** Removed the word "Keys" (now just shows the 🔑 icon).
- **Control Positioning:** MapLibre controls (like the Geolocation button) default to the top-right. The custom floating Keys button was overlapping. Moved the Keys button to the absolute top-right and used MapLibre's built-in position parameters to push the Geolocation control below it.
- **Context Menu:** 
  - Removed "Cancel" button since clicking anywhere outside the menu already closes it.
  - Removed the hover animation (push right) for a simpler, flat feel.
  - Adjusted map click logic to ensure that if the user clicks the map *while* the context menu is open, the menu simply closes instead of immediately opening a new menu at the new tapped location.

## 2. MapLibre Configuration
- **Attribution & OSM Control:** Completely disabled `AttributionControl` to hide "OpenStreetMap contributors" and save screen real estate.
- **Auto-Tracking:** Configured the `GeolocateControl` to automatically invoke and track user location on load (`trigger()`), so the blue location dot is visible immediately without requiring the user to tap the control first.

## 3. Vector Tile Enhancements
- **Roads:** Injected the `maptiler_planet` vector source to fetch the `transportation` layer.
- Styled roads to render visibly on top of the satellite imagery (semi-transparent white overlay with black casings/borders).
- Kept the building dual-outline enhancement previously planned.
- **Fixed Vector Visibility:** Adjusted map style definition to guarantee vector layers render last, resolving an issue where the satellite imagery was occluding the roads and building outlines.

## 4. Interaction & Marker Refinements
- **Click Propagation Bug:** Fixed an issue where clicking the map while the menu was open would immediately re-trigger the menu opening event. The `context_menu.js` logic was updated to use a capture-phase listener and `stopPropagation` to ensure the menu simply closes without the map click event bleeding through and restarting the cycle.
- **Marker Color Consistency:** Changed the logic so that all markers (both loaded from GitHub and newly created natively during the session) share the exact same styling: a bright, distinguishable orange (`#f97316`) instead of dynamically flipping between red and blue.
- **Menu Centering:** Corrected the CSS for the context menu. Previously, its top-left anchored to the absolute center. Applied `transform: translate(-50%, -50%)` properly so the actual center of the dialog sits in the center of the viewport.
- **Button Overlap Adjustments:** Since MapLibre dynamically positions its controls at the very top right edge, pushing the `keys_btn` down via CSS rather than trying to interleave them via API guarantees they will never overlap regardless of library changes or viewport size.

## 5. Additional Fixes
- **Removed redundant source addition:** The conditional `if (!mapInstance.getSource('maptiler_planet'))` block was eliminated because the Satellite style already provides the vector source.
- **Removed restrictive road filter:** The `filter: ['in', 'class', ...]` on transportation layers was removed, allowing all road classes to render.
- **Disabled geolocation accuracy circle:** Set `showAccuracyCircle: false` on `GeolocateControl` to prevent the semi‑transparent blue circle from intercepting marker clicks.
- **Context‑menu click handling:** Updated the outside‑click listener to ignore clicks on `.field-marker` elements, enabling a marker click while the menu is open to trigger the “Replace photo” action instead of merely closing the menu.
- **Cleaned up comments:** Removed explanatory comment block about the embedded vector source to keep the code concise.
