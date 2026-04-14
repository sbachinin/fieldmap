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

// UI Elements (initialized lazily)
let message_overlay_element = null;
let messageTextElement = null;
let current_timeout = null;

/**
 * Initializes the overlay HTML and CSS if not already present in the DOM.
 */
function ensure_overlay_initialized() {
    if (message_overlay_element) return;

    // 1. Inject CSS if not present
    if (!document.getElementById('message_overlay_styles')) {
        const style = document.createElement('style');
        style.id = 'message_overlay_styles';
        style.textContent = `
            #global_overlay {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 12px;
                background: rgba(239, 68, 68, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: white;
                text-align: center;
                font-weight: 500;
                font-size: 14px;
                z-index: 10000;
                display: none;
                box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
                transition: opacity 0.3s ease;
            }
            #global_overlay .close-btn {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
                transition: opacity 0.2s;
                display: none;
            }
            #global_overlay .close-btn:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
            }
            #global_overlay.error .close-btn {
                display: flex;
            }
            #global_overlay.visible {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Inject HTML if not present
    message_overlay_element = document.getElementById('global_overlay');
    if (!message_overlay_element) {
        message_overlay_element = document.createElement('div');
        message_overlay_element.id = 'global_overlay';
        message_overlay_element.innerHTML = `
            <span class="message-text"></span>
            <button class="close-btn" id="overlay_close_btn">×</button>
        `;
        document.body.appendChild(message_overlay_element);
    }

    messageTextElement = message_overlay_element.querySelector('.message-text');
    const closeBtn = message_overlay_element.querySelector('#overlay_close_btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hide_message_overlay);
    }
}

/**
 * Show the message overlay with a message and optional styling
 * @param {string} message - The message to display
 * @param {string} color - Background color (use MESSAGE_OVERLAY_CONFIG.COLORS)
 * @param {boolean} auto_hide - Whether to auto-hide after delay (default: true)
 */
function show_message_overlay(message, color = MESSAGE_OVERLAY_CONFIG.COLORS.WARNING, auto_hide = true) {
    ensure_overlay_initialized();
    
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
