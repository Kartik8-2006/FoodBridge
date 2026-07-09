// This file is like a messenger that:
// 1. Takes messages to the backend server
// 2. Automatically includes your login token if you have one
// 3. Handles errors nicely
// 4. Returns the response data

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
