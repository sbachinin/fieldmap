/**
 * js/github/client.js
 * 
 * Centralized client for interacting with the GitHub REST API.
 * Provides consistent authentication, URL construction, and error handling.
 */

import { get_credentials } from '../credentials.js';
import { GITHUB_CONFIG } from '../constants.js';

const { OWNER, REPO } = GITHUB_CONFIG;
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`;

/**
 * Performs a request to the GitHub API.
 * 
 * @param {string} endpoint - The API endpoint (e.g., 'contents/path', 'git/trees/main')
 * @param {Object} options - Standard fetch options
 * @returns {Promise<any>} - The parsed JSON response
 * @throws {Error} - On network failure or non-OK response with descriptive message
 */
export async function github_request(endpoint, options = {}) {
    const { github_token } = get_credentials();
    const url = `${BASE_URL}/${endpoint}`;

    const headers = {
        'Authorization': `Bearer ${github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let message = `GitHub Error: ${response.status} ${response.statusText}`;
            try {
                const data = await response.json();
                if (data.message) message += ` - ${data.message}`;
                if (data.errors) message += ` (${data.errors.map(e => e.message || e).join(', ')})`;
            } catch (e) { }
            throw new Error(message);
        }

        // Handle 204 No Content
        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Network error: Could not connect to GitHub API. Please check your internet connection.");
        }
        throw error;
    }
}
