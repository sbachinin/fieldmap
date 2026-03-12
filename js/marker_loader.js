/**
 * marker_loader.js
 * 
 * Uses the GitHub Git Trees API to rapidly load all existing coordinate folders
 * on startup, turning the repository into a spatial database.
 */

import { get_credentials } from './credentials.js';
import * as map_module from './map.js';

const OWNER = 'sbachinin';
const REPO = 'reference-images-for-map';

export async function load_existing_markers() {
    const { github_token } = get_credentials();
    if (!github_token) return;

    try {
        // Fetch the entire tree recursively from main branch
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/main?recursive=1`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${github_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!res.ok) {
            console.error("Failed to load git tree", res.status);
            return;
        }

        const data = await res.json();
        
        // Structure is like "photos/52.12345_13.45678/image.jpg"
        // We evaluate trees/folders representing the coordinates
        data.tree.forEach(item => {
            if (item.type === 'tree' && item.path.startsWith('photos/')) {
                const folderName = item.path.replace('photos/', ''); // "52.12345_13.45678"
                if (folderName.includes('_')) {
                    const parts = folderName.split('_');
                    if (parts.length === 2) {
                        const lat = parseFloat(parts[0]);
                        const lon = parseFloat(parts[1]);
                        
                        if (!isNaN(lat) && !isNaN(lon)) {
                            map_module.add_marker(lat, lon, true);
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error loading existing markers:", err);
    }
}
