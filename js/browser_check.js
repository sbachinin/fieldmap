/**
 * browser_check.js
 * 
 * Detects if the user is visiting from Firefox on a mobile device.
 * If so, displays a blocking message as requested.
 * 
 * Refactored to be used as an ES module.
 */

function is_firefox_mobile() {
    const ua = navigator.userAgent.toLowerCase();
    const isFirefox = ua.includes('firefox') || ua.includes('fxios');
    const isMobile = /android|iphone|ipad|ipod/i.test(ua);
    return isFirefox && isMobile;
}

/**
 * Checks if the browser should be blocked and injects the UI if necessary.
 * @returns {boolean} True if the browser is blocked, false otherwise.
 */
export function check_browser_and_block_if_needed() {
    if (!is_firefox_mobile()) return false;

    // Create blocking overlay
    const overlay = document.createElement('div');
    overlay.id = 'browser-block-overlay';
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'block-message-container';
    
    const heading = document.createElement('h1');
    heading.textContent = 'Browser Not Supported';
    
    const message = document.createElement('p');
    message.textContent = "This map is unavailable on Firefox because of the problem, which was a white map after taking a picture in the camera. Therefore to avoid problems Firefox is disabled in this app and please use Chrome or anything else.";
    
    messageContainer.appendChild(heading);
    messageContainer.appendChild(message);
    overlay.appendChild(messageContainer);
    
    document.body.appendChild(overlay);
    
    // Add class to body to prevent scrolling
    document.body.classList.add('browser-blocked');

    return true;
}
