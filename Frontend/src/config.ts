// API Configuration
// Automatically detects backend URL based on frontend's hostname
// For localhost development: http://localhost:3000
// For network access: automatically uses same host as frontend

function getDefaultApiUrl(): string {
  // 1. If we are on localhost, always default to localhost:3000
  // This prevents stale IP addresses in .env.local from breaking local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 2. Use environment variable if provided
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env;

  // 3. Fallback: use the same hostname as the frontend with port 3000
  return `http://${window.location.hostname}:3000`;
}

const API_BASE_URL = getDefaultApiUrl();

export default API_BASE_URL;
