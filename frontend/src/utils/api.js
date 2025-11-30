import axios from 'axios';

// Use environment variable for API URL
// In production (Vercel), use the Railway backend URL
// In development, use proxy (/api) which Vite proxies to localhost:5001
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://shophub-production-e2cc.up.railway.app/api' : '/api');

console.log('API Configuration:', { 
  API_URL, 
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE 
});

// Memory fallback for tokens when localStorage isn't available (e.g., iOS private browsing)
let memoryTokens = {
  accessToken: null,
  refreshToken: null
};

// Safe storage utility that falls back to memory if localStorage fails
export const tokenStorage = {
  getAccessToken: () => {
    try {
      return localStorage.getItem('accessToken') || memoryTokens.accessToken;
    } catch {
      return memoryTokens.accessToken;
    }
  },
  getRefreshToken: () => {
    try {
      return localStorage.getItem('refreshToken') || memoryTokens.refreshToken;
    } catch {
      return memoryTokens.refreshToken;
    }
  },
  setAccessToken: (token) => {
    memoryTokens.accessToken = token;
    try {
      localStorage.setItem('accessToken', token);
    } catch (e) {
      console.warn('localStorage not available, using memory storage');
    }
  },
  setRefreshToken: (token) => {
    memoryTokens.refreshToken = token;
    try {
      localStorage.setItem('refreshToken', token);
    } catch (e) {
      console.warn('localStorage not available, using memory storage');
    }
  },
  clearTokens: () => {
    memoryTokens = { accessToken: null, refreshToken: null };
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (e) {
      // Ignore
    }
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout for mobile networks
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug logging for troubleshooting
    if (import.meta.env.DEV || config.url?.includes('/auth/')) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        withCredentials: config.withCredentials
      });
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => {
    // Debug logging for auth responses
    if (response.config.url?.includes('/auth/')) {
      console.log(`API Response: ${response.config.url}`, { status: response.status });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log all errors for debugging
    console.error('API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      isNetworkError: !error.response
    });

    // Handle network errors (no response)
    if (!error.response) {
      console.error('Network Error - No response received. Check internet connection or CORS.');
      return Promise.reject(error);
    }

    // Skip refresh logic for auth endpoints to prevent infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    // If 401 and we haven't tried to refresh yet and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Attempting token refresh...');
        // Send refresh token in body as fallback for mobile browsers where cookies may not work
        const refreshToken = tokenStorage.getRefreshToken();
        const response = await axios.post(
          `${API_URL}/auth/refresh`, 
          { refreshToken }, 
          { 
            withCredentials: true,
            timeout: 30000 
          }
        );
        const { accessToken } = response.data.data;
        
        console.log('Token refresh successful');
        tokenStorage.setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.status || refreshError.message);
        isRefreshing = false;
        tokenStorage.clearTokens();
        // Don't redirect, just reject the promise - let the component handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
