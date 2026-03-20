/**
 * message_overlay.js
 * 
 * Provides a centralized message overlay system for displaying notifications,
 * loading states, and error messages to the user.
 */

// Message overlay configuration constants
const MESSAGE_OVERLAY_CONFIG = {
    COLORS: {
        LOADING: 'rgba(59, 130, 246, 0.9)',    // Blue
        SUCCESS: 'rgba(16, 185, 129, 0.9)',    // Green  
        ERROR: 'rgba(239, 68, 68, 0.9)',       // Red
        WARNING: 'rgba(239, 68, 68, 0.85)'     // Red (default)
    },
    AUTO_HIDE_DELAY: 3000
};

const message_overlay_element = document.getElementById('global_overlay');
const closeBtn = document.getElementById('overlay_close_btn');
const messageTextElement = message_overlay_element.querySelector('.message-text');
closeBtn.addEventListener('click', hide_message_overlay);

// Track the current timeout for auto-hiding messages
let current_timeout = null;

/**
 * Show the message overlay with a message and optional styling
 * @param {string} message - The message to display
 * @param {string} color - Background color (use MESSAGE_OVERLAY_CONFIG.COLORS)
 * @param {boolean} autoHide - Whether to auto-hide after delay (default: true)
 */
function show_message_overlay(message, color = MESSAGE_OVERLAY_CONFIG.COLORS.WARNING, auto_hide = true) {
    messageTextElement.textContent = message;
    
    message_overlay_element.style.backgroundColor = color;
    message_overlay_element.classList.add('visible');

    // Clear any existing timeout before setting a new one
    if (current_timeout) {
        clearTimeout(current_timeout);
        current_timeout = null;
    }

    if (auto_hide) {
        current_timeout = setTimeout(() => {
            hide_message_overlay();
            current_timeout = null;
        }, MESSAGE_OVERLAY_CONFIG.AUTO_HIDE_DELAY);
    }
}

/**
 * Hide the message overlay
 */
function hide_message_overlay() {
    if (!message_overlay_element) return;
    
    message_overlay_element.classList.remove('visible');
    message_overlay_element.classList.remove('error'); // Remove error class
    // Reset color to default warning color
    message_overlay_element.style.backgroundColor = MESSAGE_OVERLAY_CONFIG.COLORS.WARNING;
}

/**
 * Show a loading message
 * @param {string} message - The loading message
 */
function show_loading(message = 'Loading...') {
    show_message_overlay(message, MESSAGE_OVERLAY_CONFIG.COLORS.LOADING, false);
}

/**
 * Show a success message
 * @param {string} message - The success message
 */
function show_success(message = 'Success!') {
    show_message_overlay(message, MESSAGE_OVERLAY_CONFIG.COLORS.SUCCESS, true);
}

/**
 * Show an error message with close button (no auto-hide)
 * @param {string} message - The error message
 */
function show_error(message = 'An error occurred') {
    show_message_overlay(message, MESSAGE_OVERLAY_CONFIG.COLORS.ERROR, false);
    message_overlay_element.classList.add('error');
}

/**
 * Show a warning message
 * @param {string} message - The warning message
 */
function show_warning(message = 'Warning') {
    show_message_overlay(message, MESSAGE_OVERLAY_CONFIG.COLORS.WARNING, true);
}

export {
    show_loading,
    show_success,
    show_error,
    show_warning,
    hide_message_overlay
};
