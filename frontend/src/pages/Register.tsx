import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Input from '../components/common/Input';
import AuthButton from '../components/common/AuthButton';
import useForm from '../hooks/useForm';

interface RegisterFormValues {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const Register: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Form validation function
  const validateForm = (values: RegisterFormValues) => {
    const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
    
    // Nombre validation
    if (!values.nombre) {
      errors.nombre = 'El nombre es requerido';
    }
    
    // Apellido validation
    if (!values.apellido) {
      errors.apellido = 'El apellido es requerido';
    }
    
    // Username validation
    if (!values.username) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (values.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.username)) {
      errors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }
    
    // Email validation
    if (!values.email) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Correo electrónico inválido';
    }
    
    // Password validation
    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    } else if (values.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Confirm password validation
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirme su contraseña';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    // Terms validation
    if (!values.acceptTerms) {
      errors.acceptTerms = 'Debe aceptar los términos y condiciones';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Mock API call - replace with actual API call
      // const response = await api.post('/auth/register', {
      //   email: values.email,
      //   password: values.password,
      //   username: values.username,
      //   fullName: `${values.nombre} ${values.apellido}`
      // });
      
      console.log('Formulario de registro enviado:', values);
      
      // Simulate successful registration
      setTimeout(() => {
        setRegistrationSuccess(true);
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      setServerError('Error en el registro. Por favor, inténtelo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const form = useForm<RegisterFormValues>({
    initialValues: {
      nombre: '',
      apellido: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  // Register icon
  const registerIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  // Login icon
  const loginIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  // User icon
  const userIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <MainLayout title="Registro">
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-10 px-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-green-1">Crear Cuenta</h1>
            <p className="text-gray-1 mt-2">Únete a nuestra comunidad hoy</p>
          </div>
          
          {serverError && (
            <div className="mb-4 p-3 bg-red-1/10 border border-red-1 rounded-md text-red-1 text-sm">
              {serverError}
            </div>
          )}
          
          {registrationSuccess ? (
            <div className="text-center py-6">
              <div className="mb-4 p-4 bg-green-0-5 rounded-full inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Registro Exitoso!</h2>
              <p className="text-gray-1 mb-4">Su cuenta ha sido creada exitosamente.</p>
              <AuthButton 
                icon={loginIcon}
                onClick={() => window.location.href = '/login'}
                fullWidth={false}
                className="mx-auto bg-green-1 text-white hover:bg-green-0-9"
              >
                Iniciar Sesión
              </AuthButton>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Nombre"
                    type="text"
                    name="nombre"
                    placeholder="Ingrese su nombre"
                    value={form.values.nombre}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.nombre && !!form.errors.nombre}
                    helperText={form.touched.nombre ? form.errors.nombre : ''}
                    fullWidth
                  />
                </div>
                <div>
                  <Input
                    label="Apellido"
                    type="text"
                    name="apellido"
                    placeholder="Ingrese su apellido"
                    value={form.values.apellido}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.apellido && !!form.errors.apellido}
                    helperText={form.touched.apellido ? form.errors.apellido : ''}
                    fullWidth
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Input
                  label="Nombre de usuario"
                  type="text"
                  name="username"
                  placeholder="Elija un nombre de usuario único"
                  value={form.values.username}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.username && !!form.errors.username}
                  helperText={form.touched.username ? form.errors.username : ''}
                  fullWidth
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  name="email"
                  placeholder="Ingrese su correo electrónico"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.email && !!form.errors.email}
                  helperText={form.touched.email ? form.errors.email : ''}
                  fullWidth
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  placeholder="Ingrese su contraseña"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.password && !!form.errors.password}
                  helperText={form.touched.password ? form.errors.password : ''}
                  fullWidth
                  showPasswordToggle
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repita su contraseña"
                  value={form.values.confirmPassword}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.confirmPassword && !!form.errors.confirmPassword}
                  helperText={form.touched.confirmPassword ? form.errors.confirmPassword : ''}
                  fullWidth
                  showPasswordToggle
                />
              </div>
              
              <div className="mt-6 flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    className="h-4 w-4 text-green-1 focus:ring-green-1 border-gray-0-5 rounded"
                    checked={form.values.acceptTerms}
                    onChange={form.handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="font-medium text-gray-1">
                    Acepto los <a href="#" className="text-green-1 hover:underline">Términos y Condiciones</a>
                  </label>
                  {form.touched.acceptTerms && form.errors.acceptTerms && (
                    <p className="mt-1 text-red-1">{form.errors.acceptTerms}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <AuthButton
                  type="submit"
                  isLoading={isSubmitting}
                  icon={registerIcon}
                  className="bg-green-1 text-white hover:bg-green-0-9"
                >
                  {isSubmitting ? 'Registrando' : 'Registrarse'} {!isSubmitting && <span className="ml-2">→</span>}
                </AuthButton>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-1">
                  ¿Ya tienes cuenta? <a href="/login" className="text-green-1 hover:underline">Inicia Sesión</a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Register; 