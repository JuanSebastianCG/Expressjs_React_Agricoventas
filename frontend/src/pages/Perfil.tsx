import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import userService, { User, UserUpdateData } from '../services/userService';

const Perfil: React.FC = () => {
  const { user: contextUser, updateUser: updateContextUser } = useAppContext();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserUpdateData>({
    fullName: '',
    email: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getCurrentUser();
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
        });
        setLoading(false);
      } catch (err) {
        setError('Error al cargar la información del usuario');
        setLoading(false);
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!contextUser) {
      navigate('/login');
    }
  }, [contextUser, navigate]);
  
  // Manejar cambios en el formulario de información personal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar la selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Crear URL para previsualización
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  // Manejar el envío del formulario de información personal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await userService.updateCurrentUser(formData);
      
      setUser(updatedUser);
      updateContextUser({
        ...contextUser!,
        fullName: updatedUser.fullName,
        email: updatedUser.email
      });
      
      setSuccess('Información actualizada correctamente');
      setLoading(false);
      setIsEditing(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la información');
      setLoading(false);
      console.error('Error updating user data:', err);
    }
  };
  
  // Manejar el envío del formulario de contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await userService.updateCurrentUser({
        password: passwordData.newPassword,
      });
      
      setSuccess('Contraseña actualizada correctamente');
      setLoading(false);
      setIsChangingPassword(false);
      
      // Resetear campos de contraseña
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
      setLoading(false);
      console.error('Error updating password:', err);
    }
  };
  
  // Manejar la carga de imagen de perfil
  const handleImageUpload = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let updatedUser;
      
      // Intentar usar el archivo seleccionado si existe
      if (selectedImage) {
        try {
          updatedUser = await userService.updateCurrentProfileImage(selectedImage);
        } catch (uploadError) {
          console.error('Error subiendo archivo, intentando con URL:', uploadError);
          // Si falla el envío del archivo, intentar con una URL
          updatedUser = await userService.updateCurrentProfileImage('https://via.placeholder.com/150');
        }
      } else {
        // Si no hay imagen seleccionada, usar una URL por defecto
        updatedUser = await userService.updateCurrentProfileImage('https://via.placeholder.com/150');
      }
      
      setUser(updatedUser);
      updateContextUser({
        ...contextUser!,
        profileImage: updatedUser.profileImage
      });
      
      setSuccess('Imagen de perfil actualizada correctamente');
      setSelectedImage(null);
      setPreviewUrl(null);
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setLoading(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la imagen de perfil');
      setLoading(false);
      console.error('Error updating profile image:', err);
    }
  };
  
  if (loading && !user) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Cargando información...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta de imagen de perfil */}
          <Card className="bg-white shadow-sm">
            <div className="p-6 flex flex-col items-center">
              <div className="mb-4 w-32 h-32 overflow-hidden rounded-full border-4 border-gray-200">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover"
                  />
                ) : user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-4xl">
                    {user?.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-center mb-1">{user?.fullName}</h2>
              <p className="text-gray-500 text-center mb-4">{user?.email}</p>
              
              <div className="mt-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Seleccionar imagen
                </button>
                
                {selectedImage && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={loading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-300"
                  >
                    {loading ? 'Subiendo...' : 'Guardar imagen'}
                  </button>
                )}
              </div>
            </div>
          </Card>
          
          {/* Tarjeta de información personal */}
          <Card className="bg-white shadow-sm md:col-span-2">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Información personal</h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-300"
                    >
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium">{user?.fullName}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Correo electrónico</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Nombre de usuario</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Rol</p>
                    <p className="font-medium capitalize">{user?.role}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Tarjeta de cambio de contraseña */}
          <Card className="bg-white shadow-sm md:col-span-3">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
                {!isChangingPassword && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Cambiar
                  </button>
                )}
              </div>
              
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-300"
                    >
                      {loading ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-500">
                  Para cambiar tu contraseña, haz clic en el botón "Cambiar".
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Perfil; 