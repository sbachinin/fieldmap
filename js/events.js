/**
 * events.js
 * 
 * Simple publish/subscribe event bus to decouple modules and 
 * establish the application flow as documented in PLAN.md.
 */

const listeners = {};

/**
 * Subscribe to an event.
 * @param {string} event - The event name (e.g., 'MAP_TAP').
 * @param {Function} handler - The callback function to execute when the event fires.
 */
export function on(event, handler) {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event].push(handler);
}

/**
 * Publish an event.
 * @param {string} event - The event name.
 * @param {Object} [payload] - Optional data payload to pass to handlers.
 */
export function emit(event, payload) {
    if (listeners[event]) {
        listeners[event].forEach(handler => handler(payload));
    }
}
