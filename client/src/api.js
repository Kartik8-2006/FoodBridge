// This file is like a messenger that:
// 1. Takes messages to the backend server
// 2. Automatically includes your login token if you have one
// 3. Handles errors nicely
// 4. Returns the response data

const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Safety net: the backend only serves routes under /api, so always make sure
// the base URL ends with "/api" (e.g. if the env value is set without it).
const API_URL = configuredUrl.endsWith('/api')
  ? configuredUrl
  : configuredUrl.replace(/\/+$/, '') + '/api';

export async function api(path, options = {}) {

  // Gets the saved login token from browser storage
  const token = localStorage.getItem('foodbridge_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}
