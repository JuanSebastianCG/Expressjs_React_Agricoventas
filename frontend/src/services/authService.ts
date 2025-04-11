import { AxiosError } from 'axios';
import api from './api';

// API URL for auth endpoints
const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/auth`;

// Types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  username: string;
  password: string;
  remember?: boolean;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: UserData;
  token: string;
}

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Auth Service
const authService = {
  // Register new user
  async register(data: RegisterData): Promise<UserData> {
    try {
      console.log('authService - Registrando usuario:', data.username);
      const response = await api.post(`${API_URL}/register`, data);
      console.log('authService - Respuesta del registro:', response.data);
      
      // Manejar la estructura de respuesta anidada
      const userData = response.data.data?.user || response.data.user || response.data;
      return userData;
    } catch (error) {
      console.error('authService - Error en registro:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Login user
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      console.log('authService - Iniciando sesión con usuario:', data.username);
      
      const response = await api.post(`${API_URL}/login`, data);
      console.log('authService - Respuesta del login recibida:', response.status);
      
      // Extraer los datos de la respuesta
      const responseData = response.data;
      console.log('authService - Estructura de la respuesta:', JSON.stringify(responseData));
      
      // Verificar si los datos están dentro de 'data'
      const dataContainer = responseData.data || responseData;
      
      // Extraer token (puede ser 'token' o 'accessToken')
      const token = dataContainer.accessToken || dataContainer.token;
      
      // Extraer usuario
      const user = dataContainer.user;
      
      console.log('authService - Token encontrado:', !!token);
      console.log('authService - Usuario encontrado:', !!user);
      
      // Verificar respuesta
      if (!token) {
        console.error('authService - Token no encontrado en la respuesta');
        throw new Error('Respuesta del servidor inválida: falta el token de autenticación');
      }
      
      if (!user) {
        console.error('authService - Usuario no encontrado en la respuesta');
        throw new Error('Respuesta del servidor inválida: faltan los datos del usuario');
      }
      
      // Datos mínimos requeridos del usuario
      if (!user.id || !user.username) {
        console.error('authService - Datos de usuario incompletos:', user);
        throw new Error('Datos de usuario incompletos');
      }
      
      // Asegurar que user tenga todas las propiedades requeridas
      const userData: UserData = {
        id: user.id,
        username: user.username,
        email: user.email || '',
        fullName: user.fullName || user.username,
        role: user.role || 'user',
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      // Store the token in localStorage for persistence
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      console.log('authService - Login exitoso, datos guardados en localStorage');
      
      return {
        token: token,
        user: userData
      };
    } catch (error) {
      console.error('authService - Error en login:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Logout user
  logout(): void {
    console.log('authService - Cerrando sesión');
    // Clear all auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // Get current user
  getCurrentUser(): UserData | null {
    try {
      // Check localStorage for user data
      const userStr = localStorage.getItem(USER_KEY);
      console.log('authService - getCurrentUser: Datos encontrados:', !!userStr);
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData;
      }
      return null;
    } catch (e) {
      console.error('authService - Error al obtener el usuario actual:', e);
      return null;
    }
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    const isLogged = !!this.getToken();
    console.log('authService - isLoggedIn:', isLogged);
    return isLogged;
  },

  // Get auth token
  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('authService - getToken: Token encontrado:', !!token);
    return token;
  }
};

// Helper function to parse API errors
const parseApiError = (error: AxiosError): any => {
  if (error.response) {
    console.error('authService - Error de respuesta API:', error.response.status, error.response.data);
    const errorData = error.response.data as Record<string, any>;
    // Manejar posibles estructuras de error (directa o anidada)
    return errorData.data?.error || errorData.error || errorData.message || errorData;
  }
  console.error('authService - Error de conexión:', error.message);
  return { message: error.message || 'Error de conexión con el servidor' };
};

export default authService; 