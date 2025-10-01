// lib/api-utils.js

/**
 * Get the base path for the application
 */
export function getBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Get the full API URL for a given path
 * @param {string} path - API path (e.g., '/books', '/books/123')
 * @returns {string} Full API URL
 */
export function getApiUrl(path = '') {
  const basePath = getBasePath();
  return `${basePath}/api${path}`;
}

/**
 * Get the full URL for a given page path
 * @param {string} path - Page path (e.g., '/books', '/books/new')
 * @returns {string} Full page URL
 */
export function getPageUrl(path = '') {
  const basePath = getBasePath();
  return `${basePath}${path}`;
}

/**
 * Fetch wrapper that automatically handles base paths
 * @param {string} apiPath - API path (e.g., '/books')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(apiPath, options = {}) {
  const url = getApiUrl(apiPath);
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Handle API response and extract data
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} Parsed response data
 */
export async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}