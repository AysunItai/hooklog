import axios from 'axios';

// Use environment variable for API URL in production, or empty string for relative URLs
const getBaseURL = () => {
  // In production, use relative URLs (same origin)
  // In development, Vite proxy handles routing
  if (import.meta.env.PROD) {
    return ''; // Relative URLs work in production since frontend and backend are on same domain
  }
  return ''; // Development: use relative URLs, Vite proxy will handle it
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
