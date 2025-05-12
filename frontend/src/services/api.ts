import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API configuration
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token storage key
const TOKEN_KEY = 'auth_token';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token && config.headers) {
      // Ensure the token is properly formatted and trimmed
      const cleanToken = token.trim();
      if (!cleanToken) {
        console.error('Invalid token format: empty after trimming');
        return config;
      }
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || '';
      
      // Only redirect to login if this is not from a login attempt itself
      // This prevents the redirect loop
      if (!url.includes('/auth/login')) {
        // Clear invalid tokens
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('auth_user');
        
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden responses
    if (error.response?.status === 403) {
      console.error('Permission denied:', error.response.data);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
    
    return Promise.reject(error);
  }
);

export default api; 