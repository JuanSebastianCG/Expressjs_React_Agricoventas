import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir tokens de autenticación
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Si el error es 401 (Unauthorized) y no hemos intentado renovar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Aquí iría la lógica para refrescar tokens si lo implementas
        // const refreshToken = localStorage.getItem('refreshToken');
        // const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        // localStorage.setItem('accessToken', response.data.accessToken);
        
        // Reintenta la solicitud original con el nuevo token
        // return api(originalRequest);
      } catch (refreshError) {
        // En caso de error al refrescar, limpiar el almacenamiento y redirigir al login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
