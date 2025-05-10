import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import IconNoBackground from '../../assets/IconNoBackground.png';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Agricoventas' }) => {
  const { isAuthenticated, user, logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

  }, [isAuthenticated, user]);

  // Agregar event listener para cerrar menu al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extraer iniciales del nombre del usuario
  const getUserInitials = () => {
    if (!user) return '?';
    
    // Use firstName and lastName if available
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    // Fallback to username
    return user.username ? user.username[0].toUpperCase() : '?';
  };

  // Function to navigate between pages
  const navigate = (path: string) => {
    window.location.href = path === 'home' ? '/' : `/${path}`;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  // Función para obtener la URL completa de la imagen de perfil
  const getProfileImageUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath) {
      return undefined;
    }
    // Si la URL ya es completa (comienza con http), la devolvemos tal cual
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Si no, construimos la URL completa
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3010';
    // Asegurarse de que no haya doble slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullUrl = `${apiUrl}/${cleanPath}`;
    return fullUrl;
  };

  return (
    <header className="bg-white shadow-sm py-3 relative">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
          <img 
            src={IconNoBackground} 
            alt="Agricoventas Logo" 
            className="h-12"
          />
        </div>

        {isAuthenticated ? (
          <>
            {/* Navigation for logged-in users - Desktop */}
            <nav className="hidden md:flex items-center">
              <a href="/mercado-general" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mercado General
              </a>
              <a href="/mis-productos" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mis Productos
              </a>
              <a href="/mis-pedidos" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mis Pedidos
              </a>
              <a href="/insights" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Insights
              </a>
            </nav>

            {/* User profile dropdown - Desktop */}
            <div className="hidden md:flex items-center" ref={userMenuRef}>
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={getProfileImageUrl(user.profileImage)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                                ${getUserInitials()}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-700">{user?.firstName}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      userMenuOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link 
                      to="/perfil" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                    >
                      Mi Perfil
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                    >
                      Administrar
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 hover:text-red-700"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Navigation for non-logged-in users - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/mercado-general" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Mercado General
              </a>
            </div>

            {/* Right side navigation - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/insights" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Insights
              </a>
              <a href="/register" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Regístrate
              </a>
              <a href="/login" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Iniciar Sesión
              </a>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar Producto"
                  className="py-2 px-4 pr-10 bg-white border border-gray-0-5 rounded-md focus:outline-none focus:border-green-1"
                />
                <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-1 hover:text-green-1 transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu - Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md z-50">
          <div className="px-4 py-3 border-t border-gray-0-5">
            {isAuthenticated ? (
              <>
                {/* User info for mobile */}
                <div className="flex items-center justify-between py-2 mb-2 border-b border-gray-0-5">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mr-2">
                      {user?.profileImage ? (
                        <img
                          src={getProfileImageUrl(user.profileImage)}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                                  ${getUserInitials()}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                          {getUserInitials()}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-1">{user ? `${user.firstName} ${user.lastName}` : 'Usuario'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-1 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
                
                {/* Navigation links for logged-in users on mobile */}
                <nav>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/perfil" className="block py-2 text-gray-1 hover:text-green-1">
                        Mi Perfil
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/users" className="block py-2 text-gray-1 hover:text-green-1">
                        Administrar
                      </Link>
                    </li>
                    <li>
                      <Link to="/mercado-general" className="block py-2 text-gray-1 hover:text-green-1">
                        Mercado General
                      </Link>
                    </li>
                    <li>
                      <Link to="/mis-productos" className="block py-2 text-gray-1 hover:text-green-1">
                        Mis Productos
                      </Link>
                    </li>
                    <li>
                      <Link to="/mis-pedidos" className="block py-2 text-gray-1 hover:text-green-1">
                        Mis Pedidos
                      </Link>
                    </li>
                    <li>
                      <Link to="/insights" className="block py-2 text-gray-1 hover:text-green-1">
                        Insights
                      </Link>
                    </li>
                  </ul>
                </nav>
              </>
            ) : (
              <>
                {/* Navigation links for non-logged-in users on mobile */}
                <nav>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/mercado-general" className="block py-2 text-gray-1 hover:text-green-1">
                        Mercado General
                      </Link>
                    </li>
                    <li>
                      <Link to="/insights" className="block py-2 text-gray-1 hover:text-green-1">
                        Insights
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="block py-2 text-gray-1 hover:text-green-1">
                        Regístrate
                      </Link>
                    </li>
                    <li>
                      <Link to="/login" className="block py-2 text-gray-1 hover:text-green-1">
                        Iniciar Sesión
                      </Link>
                    </li>
                  </ul>
                </nav>

                {/* Search for mobile */}
                <div className="mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar Producto"
                      className="w-full py-2 px-4 pr-10 bg-white border border-gray-0-5 rounded-md focus:outline-none focus:border-green-1"
                    />
                    <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 