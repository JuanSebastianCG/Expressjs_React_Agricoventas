import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import MainLayout from '../components/layout/MainLayout';
import PageContainer from '../components/layout/PageContainer';
import StyledButton from '../components/ui/StyledButton';
import { navigateToProducts } from '../App';

const Dashboard: React.FC = () => {
  const { user } = useAppContext();
  const isAdmin = user?.userType === 'ADMIN';
  const isSeller = user?.userType === 'SELLER' || user?.userType === 'ADMIN';
  const navigate = useNavigate();

  const goToProducts = () => {
    console.log("Dashboard: Navigating to products");
    navigateToProducts();
  };

  

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h1>
        
        {/* Prominent Products button for sellers */}
        {isSeller && (
          <div className="mb-6 bg-green-0-5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-green-1">Gestión de Productos</h2>
                <p className="text-gray-700">Administra, añade y actualiza tus productos agrícolas</p>
              </div>
              <a 
                href="/mis-productos"
                className="bg-green-1 hover:bg-green-0-9 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors shadow-md flex items-center"
              >
                Ver Mis Productos
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de bienvenida */}
          <Card className="col-span-full bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenido, {user?.firstName}</h2>
              <p className="text-gray-600">
                Este es tu panel de control donde puedes gestionar tus productos, pedidos y más.
              </p>
            </div>
          </Card>
          
          {/* Tarjeta de productos - Solo para vendedores */}
          {isSeller && (
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-0-7 rounded-md text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium ml-4 text-gray-800">Mis Productos</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-3">12</p>
                <p className="text-sm text-gray-500 mb-4">
                  Gestiona tus productos agrícolas en venta.
                </p>
                <div className="flex items-center justify-between">
                  <a 
                    href="/mis-productos" 
                    className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center"
                  >
                    Ver mis productos
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                  <a 
                    href="/mis-productos" 
                    className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md text-sm transition-colors"
                  >
                    Gestionar
                  </a>
                </div>
              </div>
            </Card>
          )}
          
          {/* Tarjeta de pedidos */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-1 rounded-md text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium ml-4 text-gray-800">Mis Pedidos</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">8</p>
              <p className="text-sm text-gray-500 mb-4">
                Consulta el estado de tus pedidos activos.
              </p>
              <Link 
                to="/mis-pedidos" 
                className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center"
              >
                Ver mis pedidos
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </Card>
          
          {/* Tarjeta de ingresos */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-0-6 rounded-md text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium ml-4 text-gray-800">Ingresos</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">$2,500</p>
              <p className="text-sm text-gray-500 mb-4">
                Resumen de tus ingresos por ventas.
              </p>
              <Link 
                to="/estadisticas" 
                className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center"
              >
                Ver detalles
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </Card>
          

          
          {/* Acciones rápidas */}
          <Card className="col-span-full bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isSeller && (
                  <>
                    <Link to="/crear-producto" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                      <svg className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Añadir producto</span>
                    </Link>

                    <a
                      href="/mis-productos"
                      className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Mis productos</span>
                    </a>
                  </>
                )}
                
                <Link to="/estadisticas" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Ver ventas</span>
                </Link>
                
                <Link to="/perfil" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Editar perfil</span>
                </Link>
                
                <Link to="/ayuda" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Ayuda</span>
                </Link>
              </div>
            </div>
          </Card>


          {/* Admin Panel - Prominently displayed for admins */}
          {isAdmin && (
            <div className="mb-8 bg-green-0-5 rounded-lg p-6 shadow-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-semibold text-green-1">Panel de Administración</h2>
                  <p className="text-gray-700 mt-1">Accede a las herramientas de administración para gestionar la plataforma</p>
                </div>
                <Link 
                  to="/admin/users" 
                  className="bg-green-1 hover:bg-green-0-9 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors shadow-md flex items-center"
                >
                  Ir al Panel de Administración
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
          


        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 