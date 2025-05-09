import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Input from '../components/common/Input';
import AuthButton from '../components/common/AuthButton';
import useForm from '../hooks/useForm';
import authService, { RegisterData } from '../services/authService';
import Notification from '../components/common/Notification';
import FormError from '../components/common/FormError';

interface RegisterFormValues {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  userType: 'BUYER' | 'SELLER';
  // Location fields
  showLocation: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  department: string;
  postalCode: string;
  country: string;
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
    
    // Only validate location fields if showLocation is true
    if (values.showLocation) {
      if (values.city && !values.department) {
        errors.department = 'El departamento es requerido si la ciudad está especificada';
      }
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Create register data
      const registerData: RegisterData = {
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.nombre,
        lastName: values.apellido,
        userType: values.userType || 'BUYER'
      };

      // Add location data if provided
      if (values.showLocation) {
        // Only include location if at least one field has a value
        if (values.addressLine1 || values.city || values.department) {
          registerData.location = {
            addressLine1: values.addressLine1 || '',
            addressLine2: values.addressLine2 || '',
            city: values.city || '',
            department: values.department || '',
            country: values.country || 'Colombia',
            postalCode: values.postalCode || ''
          };
        }
      }
      
      console.log("Register - Enviando datos:", registerData.username);
      
      // Call register API
      await authService.register(registerData);
      
      // Show success message
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different error types
      if (error && error.status === 409) {
        setServerError('El nombre de usuario o correo electrónico ya está registrado.');
      } else if (error && error.errors && Array.isArray(error.errors)) {
        // Format validation errors array from the server
        setServerError(error.errors.join(' '));
      } else if (error && typeof error.errors === 'object') {
        // Format validation errors object from the server
        const errorMessages = Object.values(error.errors).flat().join(' ');
        setServerError(errorMessages);
      } else if (error && error.message) {
        setServerError(error.message);
      } else {
        setServerError('Error en el registro. Por favor, inténtelo de nuevo.');
      }
    } finally {
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
      userType: 'BUYER',
      // Location fields
      showLocation: false,
      addressLine1: '',
      addressLine2: '',
      city: '',
      department: '',
      postalCode: '',
      country: 'Colombia'
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  // Toggle location section
  const toggleLocationSection = () => {
    form.setFieldValue('showLocation', !form.values.showLocation);
  };

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

  // Location icon
  const locationIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
            <Notification 
              type="error" 
              message={serverError} 
              onClose={() => setServerError(null)}
              autoClose={true}
              autoCloseTime={8000}
            />
          )}
          
          {registrationSuccess ? (
            <div className="text-center py-6">
              <Notification 
                type="success" 
                message="¡Su cuenta ha sido creada exitosamente! Ya puede iniciar sesión con sus credenciales."
              />
              <div className="mb-4 p-4 bg-green-0-5 rounded-full inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Registro Exitoso!</h2>
              <p className="text-gray-1 mb-6">Su cuenta ha sido creada exitosamente.</p>
              <AuthButton 
                icon={loginIcon}
                onClick={() => window.location.href = '/login'}
                fullWidth={false}
                className="mx-auto bg-green-1 text-white hover:bg-green-0-9 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar Sesión
              </AuthButton>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit} className="space-y-4">
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
              
              <div>
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
              
              <div>
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
              
              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  placeholder="Cree una contraseña segura"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.password && !!form.errors.password}
                  helperText={form.touched.password ? form.errors.password : ''}
                  fullWidth
                />
              </div>
              
              <div>
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
                />
              </div>
              
              {/* Location toggle section */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={toggleLocationSection}
                  className="flex items-center text-green-1 font-medium hover:text-green-0-9 focus:outline-none transition-colors"
                >
                  {locationIcon}
                  <span className="ml-2">
                    {form.values.showLocation ? 'Ocultar información de ubicación' : 'Agregar información de ubicación (opcional)'}
                  </span>
                  <svg
                    className={`ml-2 h-5 w-5 transition-transform ${form.values.showLocation ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Collapsible location fields */}
              {form.values.showLocation && (
                <div className="bg-white border border-gray-0-5 p-4 rounded-md mt-2 space-y-4 animate-fadeIn shadow-sm">
                  <div>
                    <Input
                      label="Dirección"
                      type="text"
                      name="addressLine1"
                      placeholder="Ej. Calle 123 #45-67"
                      value={form.values.addressLine1}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={form.touched.addressLine1 && !!form.errors.addressLine1}
                      helperText={form.touched.addressLine1 ? form.errors.addressLine1 : ''}
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Ciudad"
                      type="text"
                      name="city"
                      placeholder="Ej. Medellín"
                      value={form.values.city}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={form.touched.city && !!form.errors.city}
                      helperText={form.touched.city ? form.errors.city : ''}
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <Input
                      label="Departamento"
                      type="text"
                      name="department"
                      placeholder="Ej. Antioquia"
                      value={form.values.department}
                      onChange={form.handleChange}
                      onBlur={form.handleBlur}
                      error={form.touched.department && !!form.errors.department}
                      helperText={form.touched.department ? form.errors.department : ''}
                      fullWidth
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Código Postal"
                        type="text"
                        name="postalCode"
                        placeholder="Ej. 050001"
                        value={form.values.postalCode}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        error={form.touched.postalCode && !!form.errors.postalCode}
                        helperText={form.touched.postalCode ? form.errors.postalCode : ''}
                        fullWidth
                      />
                    </div>
                    <div>
                      <Input
                        label="País"
                        type="text"
                        name="country"
                        placeholder="Ej. Colombia"
                        value={form.values.country}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        error={form.touched.country && !!form.errors.country}
                        helperText={form.touched.country ? form.errors.country : ''}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start my-4">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={form.values.acceptTerms}
                    onChange={form.handleChange}
                    className="w-4 h-4 border border-gray-0-9 rounded bg-gray-0-5 accent-green-1 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="font-medium text-gray-1 cursor-pointer">
                    Acepto los términos y condiciones
                  </label>
                  {form.touched.acceptTerms && form.errors.acceptTerms && (
                    <FormError message={form.errors.acceptTerms} />
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <AuthButton
                  type="submit"
                  icon={registerIcon}
                  isLoading={isSubmitting}
                  fullWidth
                  className="bg-green-1 text-white hover:bg-green-0-9 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Crear Cuenta
                </AuthButton>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-gray-1">
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/login" className="text-green-1 font-medium hover:text-green-0-9">
                    Iniciar Sesión
                  </a>
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