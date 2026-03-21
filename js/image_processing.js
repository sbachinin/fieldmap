/**
 * image_processing.js
 * 
 * Compresses and resizes the selected image before upload.
 * Drawing to canvas inherently strips EXIF metadata per the project specs.
 */

import { show_loading, show_error, show_success } from './message_overlay.js';
import * as events from './events.js';
import { handle_upload_processed_image } from './marker_actions.js';

const MAX_WIDTH = 1200; // Resize target max width
const TARGET_QUALITY = 0.7; // Initial JPEG quality to ensure < 100KB constraint

export async function handle_image_selection(payload) {
    let { file, action } = payload;
    
    try {
        file = await convert_heic_if_needed(file);

        show_loading("Processing image...");
        const blob = await process_image(file);
        
        await handle_upload_processed_image(blob, action);
    } catch (error) {
        console.error("Image flow failed", error);
        show_error(error.message || "Operation failed. Please try again.");
    }
}

export async function convert_heic_if_needed(file) {
    // Checking for HEIC and converting only if it "looks" like HEIC was too brittle and 
    // didn't work when served from GitHub Pages for unknown reasons. 
    // Therefore, ALL images are tried to be processed as HEIC, which will cause errors 
    // for all other files, but this is not a big deal because it is very quick.
    try {
        const converted = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
        });

        // heic2any can return an array for multi-image files; take the first one
        return Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
        // Not a HEIC file, or conversion not needed — return original
        return file;
    }
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
