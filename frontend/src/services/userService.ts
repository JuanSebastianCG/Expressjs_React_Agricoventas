import api from './api';
import { AxiosError } from 'axios';

// API URL for user endpoints
const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/users`;

// Tipos
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateData {
  fullName?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
  profileImage?: string;
}

// Función para manejar errores de API
const parseApiError = (error: AxiosError): Error => {
  if (error.response) {
    // La respuesta del servidor con estado de error
    const data = error.response.data as any;
    const message = data.message || data.error || 'Error del servidor';
    return new Error(message);
  }
  return error as Error;
};

// Servicio de usuarios
const userService = {
  // Obtener todos los usuarios
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get(API_URL);
      return response.data.data.users;
    } catch (error) {
      console.error('userService - Error al obtener usuarios:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Obtener un usuario por ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data.data.user;
    } catch (error) {
      console.error(`userService - Error al obtener usuario ${id}:`, error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Obtener el usuario actual basado en el token JWT
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get(`${API_URL}/me`);
      return response.data.data.user;
    } catch (error) {
      console.error('userService - Error al obtener usuario actual:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Actualizar un usuario
  async updateUser(id: string, userData: UserUpdateData): Promise<User> {
    try {
      const response = await api.put(`${API_URL}/${id}`, userData);
      return response.data.data.user;
    } catch (error) {
      console.error(`userService - Error al actualizar usuario ${id}:`, error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Actualizar la foto de perfil del usuario
  async updateProfileImage(id: string, imageFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);
      
      const response = await api.put(`${API_URL}/${id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data.user;
    } catch (error) {
      console.error(`userService - Error al actualizar foto de perfil de usuario ${id}:`, error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Eliminar un usuario
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error(`userService - Error al eliminar usuario ${id}:`, error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Actualizar el perfil del usuario actual
  async updateCurrentUser(userData: UserUpdateData): Promise<User> {
    try {
      const response = await api.put(`${API_URL}/me`, userData);
      return response.data.data.user;
    } catch (error) {
      console.error('userService - Error al actualizar perfil de usuario actual:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  },

  // Actualizar la foto de perfil del usuario actual
  async updateCurrentProfileImage(imageInput: File | string): Promise<User> {
    try {
      let response;
      
      if (typeof imageInput === 'string') {
        // Si es una URL, enviar como JSON
        response = await api.put(`${API_URL}/me/profile-image`, {
          imageUrl: imageInput
        });
      } else {
        // Si es un archivo, usar FormData
        const formData = new FormData();
        formData.append('profileImage', imageInput);
        
        response = await api.put(`${API_URL}/me/profile-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      return response.data.data.user;
    } catch (error) {
      console.error('userService - Error al actualizar foto de perfil del usuario actual:', error);
      const axiosError = error as AxiosError;
      throw parseApiError(axiosError);
    }
  }
};

export default userService; 