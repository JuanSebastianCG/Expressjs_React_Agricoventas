import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Agricoventas' }) => {
  const { isAuthenticated, user, logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log('Header - Estado de autenticación:', isAuthenticated);
    console.log('Header - Usuario:', user?.username || 'no hay usuario');
  }, [isAuthenticated, user]);

  // Extraer iniciales del nombre del usuario
  const getUserInitials = () => {
    if (!user || !user.fullName) return '?';
    const names = user.fullName.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  // Function to navigate between pages
  const navigate = (path: string) => {
    window.location.href = path === 'home' ? '/' : `/${path}`;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm py-3 relative">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
          <svg width="30" height="30" viewBox="0 0 24 24" className="mr-2">
            <path d="M4.99 7.96c.2-1.01.84-1.83 1.8-2.27l3.99-1.86c.18-.08.38-.08.56 0l4.01 1.86c1.83.84 2.66 3.01 1.82 4.85-.38.82-1.07 1.47-1.92 1.77" fill="#E3E986" />
            <path d="M10.35 8.5c.2-1.01.84-1.83 1.8-2.27l3.99-1.86c.18-.08.38-.08.56 0l4.01 1.86c1.83.84 2.66 3.01 1.82 4.85-.38.82-1.07 1.47-1.92 1.77" fill="#046B4D" />
          </svg>
          <h1 className="text-xl font-bold">
            <span className="text-green-1">Agric</span>
            <span className="text-yellow-1">oventas</span>
          </h1>
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

            {/* User profile - Desktop */}
            <div className="hidden md:flex items-center">
              <div className="relative flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-1 flex items-center justify-center text-white mr-2">
                  <span>{getUserInitials()}</span>
                </div>
                <span className="text-gray-1 mr-1">Hola, {user?.fullName || 'Usuario'}</span>
                <button 
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 bg-red-1 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Salir
                </button>
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
                <div className="flex items-center py-2 mb-2 border-b border-gray-0-5">
                  <div className="h-8 w-8 rounded-full bg-green-1 flex items-center justify-center text-white mr-2">
                    <span>{getUserInitials()}</span>
                  </div>
                  <span className="text-gray-1">{user?.fullName || 'Usuario'}</span>
                </div>
                
                {/* Navigation links for logged-in users on mobile */}
                <nav>
                  <ul className="space-y-2">
                    <li>
                      <a href="/mercado-general" className="block py-2 text-gray-1 hover:text-green-1">
                        Mercado General
                      </a>
                    </li>
                    <li>
                      <a href="/mis-productos" className="block py-2 text-gray-1 hover:text-green-1">
                        Mis Productos
                      </a>
                    </li>
                    <li>
                      <a href="/mis-pedidos" className="block py-2 text-gray-1 hover:text-green-1">
                        Mis Pedidos
                      </a>
                    </li>
                    <li>
                      <a href="/insights" className="block py-2 text-gray-1 hover:text-green-1">
                        Insights
                      </a>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="block w-full text-left py-2 text-red-1 hover:text-red-700">
                        Cerrar Sesión
                      </button>
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
                      <a href="/mercado-general" className="block py-2 text-gray-1 hover:text-green-1">
                        Mercado General
                      </a>
                    </li>
                    <li>
                      <a href="/insights" className="block py-2 text-gray-1 hover:text-green-1">
                        Insights
                      </a>
                    </li>
                    <li>
                      <a href="/register" className="block py-2 text-gray-1 hover:text-green-1">
                        Regístrate
                      </a>
                    </li>
                    <li>
                      <a href="/login" className="block py-2 text-gray-1 hover:text-green-1">
                        Iniciar Sesión
                      </a>
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