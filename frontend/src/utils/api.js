import axios from 'axios';

// Use environment variable for API URL
// In production (Vercel), use the Railway backend URL
// In development, use proxy (/api) which Vite proxies to localhost:5001
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://shophub-production-e2cc.up.railway.app/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints to prevent infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    // If 401 and we haven't tried to refresh yet and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send refresh token in body as fallback for mobile browsers where cookies may not work
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_URL}/auth/refresh`, 
          { refreshToken }, 
          { withCredentials: true }
        );
        const { accessToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Don't redirect, just reject the promise - let the component handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
