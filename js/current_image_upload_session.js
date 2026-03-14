/**
 * current_image_upload_session.js
 * 
 * Centralized state for the current image upload lifecycle.
 * Prevents race conditions and "prop drilling" across modules.
 */

let session = null;

/**
 * Returns the current active session or null.
 */
export function get_session() {
    return session;
}

/**
 * Starts a new session if one isn't already active.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {boolean} is_replacing - Whether this is a replacement operation
 * @throws {Error} if a session is already active
 */
export function begin_session(lat, lon, is_replacing) {
    if (session) {
        throw new Error("An image upload is already in progress.");
    }
    session = { lat, lon, is_replacing };
}

/**
 * Clears the current session to allow for new operations.
 */
export function end_session() {
    session = null;
}
