import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import useForm from '../hooks/useForm';
import { useAppContext } from '../context/AppContext';
import AuthButton from '../components/common/AuthButton';
import authService, { LoginData } from '../services/authService';
import Notification from '../components/common/Notification';
import FormError from '../components/common/FormError';

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form validation function
  const validateForm = (values: LoginFormValues) => {
    const errors: Partial<Record<keyof LoginFormValues, string>> = {};
    
    if (!values.username) {
      errors.username = 'El nombre de usuario es requerido';
    }
    
    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Prepare login data
      const loginData: LoginData = {
        username: values.username,
        password: values.password,
        remember: values.rememberMe
      };
      
      
      // Call the API to login
      const response = await authService.login(loginData);
      
      // Verificar que la respuesta contiene token y datos de usuario
      if (!response || !response.token) {
        throw new Error('Respuesta del servidor inválida: falta el token de autenticación');
      }
      
      if (!response.user) {
        throw new Error('Respuesta del servidor inválida: faltan los datos del usuario');
      }
      
      // Store auth info in context
      login(response.token, response.user);
      
      
      // Small delay to ensure state updates
      setTimeout(() => {
        // Redirect to home page on success
        window.location.href = '/';
      }, 200);
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle different error types
      if (error && error.status === 401) {
        setServerError('Nombre de usuario o contraseña inválidos. Por favor, inténtalo de nuevo.');
      } else if (error && error.message) {
        setServerError(error.message);
      } else {
        setServerError('Error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  // Login icon
  const loginIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <MainLayout title="Iniciar sesión">
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-10 px-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-green-1">Iniciar Sesión</h1>
            <p className="text-gray-1 mt-2">¡Bienvenido de vuelta a tu plataforma agrícola!</p>
          </div>
          
          {serverError && (
            <Notification 
              type="error" 
              message={serverError} 
              onClose={() => setServerError(null)}
              autoClose={true}
              autoCloseTime={8000}
            />
          )}
          
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-1 mb-2">
                Nombre de usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-green-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  className={`w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${
                    form.touched.username && form.errors.username 
                      ? 'border-red-1 focus:ring-red-1/20' 
                      : 'border-gray-0-5 focus:border-green-1 focus:ring-green-1/20'
                  }`}
                  placeholder="Ingrese su nombre de usuario"
                  value={form.values.username}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </div>
              {form.touched.username && form.errors.username && (
                <FormError message={form.errors.username} />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-1 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-green-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  className={`w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${
                    form.touched.password && form.errors.password 
                      ? 'border-red-1 focus:ring-red-1/20' 
                      : 'border-gray-0-5 focus:border-green-1 focus:ring-green-1/20'
                  }`}
                  placeholder="Ingrese su contraseña"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </div>
              {form.touched.password && form.errors.password && (
                <FormError message={form.errors.password} />
              )}
            </div>
            
            <div className="flex items-center mt-2">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-green-1 focus:ring-green-1 border-gray-0-5 rounded"
                checked={form.values.rememberMe}
                onChange={form.handleChange}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-1">
                Recordarme
              </label>
            </div>
            
            <div className="mt-2">
              <AuthButton
                type="submit"
                isLoading={isSubmitting}
                icon={loginIcon}
                className="bg-green-1 text-white hover:bg-green-0-9 w-full py-2.5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? 'Ingresando' : 'Ingresar'}
              </AuthButton>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-1">
                ¡No te preocupes, solo necesitas tus credenciales, no tu contraseña de WiFi! 😉
              </p>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-1">
                ¿No tienes cuenta? <a href="/register" className="text-green-1 hover:underline font-medium transition-colors">Regístrate</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login; 