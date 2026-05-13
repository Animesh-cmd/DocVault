// API Configuration
// Automatically detects backend URL based on frontend's hostname
// For localhost development: http://localhost:3000
// For network access: automatically uses same host as frontend

function getDefaultApiUrl(): string {
  // 1. Check environment variable first (highest priority)
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env;

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // 2. If running on localhost, use localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 3. If running on a cloud platform (like Vercel), don't assume port 3000
  // Instead, use the same host and protocol (standard for same-origin or proxy setups)
  if (hostname.includes('vercel.app') || hostname.includes('herokuapp') || hostname.includes('render.com')) {
    return `${protocol}//${hostname}`;
  }

  // 4. Fallback for local network access (e.g., http://192.168.1.5:5173)
  // Assumes backend is on the same machine on port 3000
  return `http://${hostname}:3000`;
}

const API_BASE_URL = getDefaultApiUrl();

export default API_BASE_URL;
