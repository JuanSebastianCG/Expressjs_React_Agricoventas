import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import IconNoBackground from '../../assets/IconNoBackground.png';
import { navigateToProducts } from '../../App';
import CartIcon from '../cart/CartIcon';

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
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path === 'home' ? '/' : `/${path}`);
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
    navigate('/');
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
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    // Asegurarse de que no haya doble slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullUrl = `${apiUrl}/${cleanPath}`;
    return fullUrl;
  };

  return (
    <header className="bg-white shadow-sm py-3 relative">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('home')}>
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
              <Link to="/mercado-general" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mercado General
              </Link>
              <a 
                href="/mis-productos"
                className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors"
              >
                Mis Productos
              </a>
              <Link to="/mis-pedidos" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mis Pedidos
              </Link>
              <Link to="/insights" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Insights
              </Link>
            </nav>

            {/* User profile dropdown - Desktop */}
            <div className="hidden md:flex items-center space-x-4" ref={userMenuRef}>
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
                    {user?.userType === 'ADMIN' && (
                      <Link 
                        to="/dashboard" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                      >
                        Administrar
                      </Link>
                    )}
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
              <div className="ml-auto">
                <CartIcon className="text-gray-700" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Navigation for non-logged-in users - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/mercado-general" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Mercado General
              </Link>
            </div>

            {/* Right side navigation - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/insights" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Insights
              </Link>
              <Link to="/register" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Regístrate
              </Link>
              <Link to="/login" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Iniciar Sesión
              </Link>

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
              <div className="ml-auto">
                <CartIcon className="text-gray-700" />
              </div>
            </div>
          </>
        )}

        {/* Mobile Menu Button and Cart Icon */}
        <div className="md:hidden flex items-center space-x-4">
          <CartIcon className="text-gray-700" />
          <button
            onClick={toggleMobileMenu}
            className="text-gray-1 hover:text-green-1 focus:outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white p-4 mt-2 shadow-md rounded-b-lg">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/mercado-general" 
              className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mercado General
            </Link>
            {isAuthenticated ? (
              <>
                <a 
                  href="/mis-productos"
                  className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Productos
                </a>
                <Link 
                  to="/mis-pedidos" 
                  className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
                <Link 
                  to="/perfil" 
                  className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <div className="border-t border-gray-200 pt-2">
                  <button 
                    onClick={handleLogout}
                    className="text-red-600 font-medium hover:text-red-700 py-2 px-4 rounded hover:bg-gray-50 w-full text-left"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="text-gray-1 font-medium hover:text-green-1 py-2 px-4 rounded hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 