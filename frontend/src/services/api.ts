import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API configuration
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

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
    // Obtener token directamente de localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Si token existe, añadir a los headers
    if (token && config.headers) {
      console.log('API Request: Añadiendo token a la petición');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('API Request: No hay token disponible');
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
    if (error.response && error.response.status === 401 && originalRequest) {
      console.log('API Response: 401 Unauthorized - Redirigiendo a login');
      // Clear invalid tokens
      localStorage.removeItem(TOKEN_KEY);
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 