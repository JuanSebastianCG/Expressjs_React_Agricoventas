import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import useForm from '../hooks/useForm';
import { useAppContext } from '../context/AppContext';
import AuthButton from '../components/common/AuthButton';

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const { login } = useAppContext();
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
      // Mock API call - replace with actual API call
      // const response = await api.post('/auth/login', values);
      console.log('Formulario de inicio de sesión enviado:', values);
      
      // Simulate successful login
      setTimeout(() => {
        login();
        // Redirect would happen here in a real app
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      setServerError('Nombre de usuario o contraseña inválidos. Por favor, inténtalo de nuevo.');
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
            <div className="mb-4 p-3 bg-red-1/10 border border-red-1 rounded-md text-red-1 text-sm">
              {serverError}
            </div>
          )}
          
          <form onSubmit={form.handleSubmit}>
            <div className="mb-4">
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
                  className="w-full px-4 py-2 pl-10 border border-gray-0-5 rounded-md focus:outline-none focus:border-green-1"
                  placeholder="Ingrese su nombre de usuario"
                  value={form.values.username}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </div>
              {form.touched.username && form.errors.username && (
                <p className="mt-1 text-sm text-red-1">{form.errors.username}</p>
              )}
            </div>
            
            <div className="mb-4">
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
                  className="w-full px-4 py-2 pl-10 border border-gray-0-5 rounded-md focus:outline-none focus:border-green-1"
                  placeholder="Ingrese su contraseña"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                />
              </div>
              {form.touched.password && form.errors.password && (
                <p className="mt-1 text-sm text-red-1">{form.errors.password}</p>
              )}
            </div>
            
            <div className="flex items-center mb-6">
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
            
            <AuthButton
              type="submit"
              isLoading={isSubmitting}
              icon={loginIcon}
              className="bg-green-1 text-white hover:bg-green-0-9"
            >
              {isSubmitting ? 'Ingresando' : 'Ingresar'}
            </AuthButton>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-1">
                ¡No te preocupes, solo necesitas tus credenciales, no tu contraseña de WiFi! 😉
              </p>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-1">
                ¿No tienes cuenta? <a href="/register" className="text-green-1 hover:underline">Regístrate</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login; 