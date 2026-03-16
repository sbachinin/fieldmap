/**
 * image_processing.js
 * 
 * Compresses and resizes the selected image before upload.
 * Drawing to canvas inherently strips EXIF metadata per the project specs.
 */

import { show_loading, show_error, show_success } from './message_overlay.js';
import * as events from './events.js';
import * as storage_api from './storage_api.js';
import { generate_storage_path } from './utils.js';

const MAX_WIDTH = 1200; // Resize target max width
const TARGET_QUALITY = 0.7; // Initial JPEG quality to ensure < 100KB constraint

/**
 * Main entry point for processing and uploading a selected image.
 * Called when 'image_selected' event is emitted.
 */
export async function handle_image_selection(payload) {
    const { file, subject } = payload;
    
    try {
        show_loading("Processing image...");
        const blob = await process_image(file);
        
        await upload_processed_image(blob, subject);
    } catch (error) {
        console.error("Image flow failed", error);
        show_error(error.message || "Operation failed. Please try again.");
    }
}

/**
 * Handles the upload and subsequent success UI of a processed image blob.
 */
async function upload_processed_image(blob, subject) {
    const { lat, lon, click_target } = subject;
    const is_replacing = click_target === 'photo_marker';

    show_loading(is_replacing ? "Replacing photo..." : "Uploading photo...");
            
    if (is_replacing) {
        await storage_api.replace_image(lat, lon, blob);
    } else {
        const path = generate_storage_path(lat, lon);
        await storage_api.upload_image(path, blob);
    }

    show_success("Upload successful!");
    events.emit('upload_complete', { lat, lon, is_replacing });
}

function process_image(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            // Calculate new dimensions, keeping aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            // Draw to canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Export to JPEG. Note: this natively strips EXIF data.
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                },
                'image/jpeg',
                TARGET_QUALITY
            );
        };
        
        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        img.src = url;
    });
}
