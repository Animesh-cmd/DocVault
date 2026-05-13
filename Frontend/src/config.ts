// API Configuration
// Automatically detects backend URL based on environment and hostname

function getDefaultApiUrl(): string {
  // 1. Check environment variable (highest priority)
  // Set this in your Vercel/Hosting provider environment variables
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env;

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // 2. Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 3. Network testing (e.g., accessing via phone on same WiFi)
  // Assumes backend is on the same machine on port 3000
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3000`;
  }

  // 4. Production fallback: use same host (works if backend is proxied or same-origin)
  return `${protocol}//${hostname}`;
}

const API_BASE_URL = getDefaultApiUrl();

export default API_BASE_URL;
