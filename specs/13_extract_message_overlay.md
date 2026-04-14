# 13. Extract message_overlay.js into a Self-Contained Module

## Goal
Extract the `message_overlay.js` functionality to be entirely self-contained, allowing it to be imported via CDN into other projects without requiring specific HTML markup or CSS rules in the host application.

## Current State
- `js/message_overlay.js` expects an element with `id="global_overlay"` to exist in the HTML.
- `index.html` contains the markup for `#global_overlay` (lines 24-28).
- `css/style.css` contains the styles for `#global_overlay` and its child elements (lines 204-258).

## Proposed Implementation

### 1. Update `js/message_overlay.js`
- Create a private function `_init_overlay()` that lazily injects the required HTML and CSS if it doesn't already exist in the document.
- The function will append a `<style>` block to the document `<head>` containing the exact CSS rules required for the overlay.
- The function will append a `<div>` to `document.body` containing the overlay's markup.
- Refactor the variables `message_overlay_element`, `closeBtn`, and `messageTextElement` to be populated dynamically on initialization, rather than right at import time, preventing errors if the DOM is not fully ready.

### 2. Clean Up Web App
- Remove the `<div id="global_overlay">...</div>` markup from `index.html`.
- Remove the `#global_overlay` related styles from `css/style.css`.

## Atomic Design
The resulting string of CSS injected will be:
```css
#global_overlay {
    position: absolute; bottom: 0; left: 0; right: 0; padding: 12px;
    background: rgba(239, 68, 68, 0.85); backdrop-filter: blur(8px);
    color: white; text-align: center; font-weight: 500; font-size: 14px;
    z-index: 50; display: none; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
#global_overlay .close-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: white; font-size: 18px;
    font-weight: bold; cursor: pointer; padding: 0; width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    opacity: 0.8; transition: opacity 0.2s; display: none;
}
#global_overlay .close-btn:hover { opacity: 1; }
#global_overlay.error .close-btn { display: flex; }
#global_overlay.visible { display: block; }
```

When someone imports this file, the first time `show_success()`, `show_error()`, `show_warning()`, or `show_loading()` is called (or on script load), the DOM constraints are verified and injected, keeping everything functional and independent in a single JS file.
