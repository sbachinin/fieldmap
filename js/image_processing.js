/**
 * image_processing.js
 * 
 * Compresses and resizes the selected image before upload.
 * Drawing to canvas inherently strips EXIF metadata per the project specs.
 */

import * as events from './events.js';

const MAX_WIDTH = 1200; // Resize target max width
const TARGET_QUALITY = 0.7; // Initial JPEG quality to ensure < 100KB constraint

export function init_image_processing() {
    events.on('image_selected', async (payload) => {
        try {
            // Show processing overlay
            const overlay = document.getElementById('global_overlay');
            if (overlay) {
                overlay.textContent = "Processing image...";
                overlay.classList.add('visible');
                overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
            }

            const processedBlob = await process_image(payload.file);
            
            if (overlay) {
                overlay.classList.remove('visible');
            }

            events.emit('image_processed', {
                blob: processedBlob,
                lat: payload.lat,
                lon: payload.lon
            });
        } catch (error) {
            console.error("Image processing failed", error);
            const overlay = document.getElementById('global_overlay');
            if (overlay) {
                overlay.textContent = "Failed to process image.";
                overlay.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                setTimeout(() => overlay.classList.remove('visible'), 3000);
            }
        }
    });
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
        
        img.onerror = reject;
        img.src = url;
    });
}
