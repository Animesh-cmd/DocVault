// API Configuration
// Change the API_BASE_URL to your backend server's IP address and port
// For local machine: http://localhost:3000
// For network access: http://YOUR_MACHINE_IP:3000

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.123.17.183:3000';

export default API_BASE_URL;
