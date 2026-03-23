/**
 * js/marker_loader.js
 * 
 * A self-contained module for loading markers from a GitHub repository.
 * This file is designed to be imported as a standalone CDN module.
 * 
 * IMPORTANT: Do NOT import any other modules from this repository into this file.
 * This module must remain fully self-contained with zero external dependencies
 * to ensure it functions correctly when loaded via CDN from other websites.
 */

/**
 * Extracts latitude and longitude from a path or folder name.
 * Expected format: ".../LAT_LON/..." or just "LAT_LON"
 * 
 * @param {string} path - The path or folder name to parse.
 * @returns {{lat: number, lon: number} | null} The coordinates or null if invalid.
 */
function parse_coords_from_path(path) {
    let folderName = path;
    if (path.includes('photos/')) {
        folderName = path.split('photos/')[1].split('/')[0];
    }

    if (folderName.includes('_')) {
        const parts = folderName.split('_');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon };
            }
        }
    }
    return null;
}

/**
 * Filter a GitHub git tree for coordinate-bearing folders and return unique locations.
 * 
 * @param {Array} tree - The GitHub git tree array.
 * @returns {Array<{lat: number, lon: number}>} Array of unique coordinate objects.
 */
function get_unique_locations_from_tree(tree) {
    const uniqueLocations = new Set();
    const result = [];

    tree.forEach(item => {
        if (item.type === 'tree' && item.path.startsWith('photos/')) {
            const coords = parse_coords_from_path(item.path);
            if (coords) {
                const coordKey = `${coords.lat}_${coords.lon}`;
                if (!uniqueLocations.has(coordKey)) {
                    uniqueLocations.add(coordKey);
                    result.push(coords);
                }
            }
        }
    });

    return result;
}

/**
 * Fetches all existing coordinate folders from GitHub.
 * 
 * NOTE: github_token is optional. If not provided, the request is made without authentication.
 * Unauthenticated requests to the GitHub API are subject to much lower rate limits 
 * (typically 60 requests per hour per IP) compared to authenticated requests.
 * If these limits are frequently hit, providing a token will be necessary.
 * 
 * @param {Object} params
 * @param {string} [params.github_token] - Optional GitHub Personal Access Token
 * @param {string} params.owner - GitHub repository owner
 * @param {string} params.repo - GitHub repository name
 * @param {string} [params.branch='main'] - GitHub branch name
 * @returns {Promise<Array<{lat: number, lon: number}>>}
 */
export async function load_markers({ github_token, owner, repo, branch = 'main' }) {
    const timestamp = Date.now();
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1&t=${timestamp}`;

    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };

    if (github_token) {
        headers['Authorization'] = `Bearer ${github_token}`;
    }

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            let message = `GitHub Error: ${response.status} ${response.statusText}`;
            try {
                const data = await response.json();
                if (data.message) message += ` - ${data.message}`;
            } catch (e) { }
            throw new Error(message);
        }

        const data = await response.json();
        if (!data || !data.tree) return [];

        return get_unique_locations_from_tree(data.tree);
    } catch (error) {
        console.error("Failed to load markers from GitHub:", error.message);
        return [];
    }
}
