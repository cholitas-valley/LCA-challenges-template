import axios from 'axios';

// Use relative URL to work with nginx proxy in production
// In development, VITE_API_URL can be set to http://localhost:3000
const apiUrl = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method ? config.method.toUpperCase() : 'GET';
    console.log(`[API] ${method} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
