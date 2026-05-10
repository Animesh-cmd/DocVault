// API Configuration
// Automatically detects backend URL based on frontend's hostname
// For localhost development: http://localhost:3000
// For network access: automatically uses same host as frontend

function getDefaultApiUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env;

  // If running on localhost, use localhost:3000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // For any other hostname (IP or domain), use same host with port 3000
  return `http://${window.location.hostname}:3000`;
}

const API_BASE_URL = getDefaultApiUrl();

export default API_BASE_URL;
