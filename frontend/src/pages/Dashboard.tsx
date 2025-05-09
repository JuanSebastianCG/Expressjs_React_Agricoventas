import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import MainLayout from '../components/layout/MainLayout';

const Dashboard: React.FC = () => {
  const { user } = useAppContext();
  const isAdmin = user?.userType === 'admin';

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h1>
        
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
          
          {/* Tarjeta de productos */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-500 rounded-md text-white">
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
              <Link 
                to="/products" 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
              >
                Ver mis productos
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </Card>
          
          {/* Tarjeta de pedidos */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500 rounded-md text-white">
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
                to="/orders" 
                className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
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
                <div className="p-3 bg-purple-500 rounded-md text-white">
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
                to="/analytics" 
                className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
              >
                Ver detalles
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </Card>
          
          {/* Panel de Administración (solo para admins) */}
          {isAdmin && (
            <Card className="col-span-full bg-purple-50 border-purple-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-purple-800 mb-3">Panel de Administración</h2>
                <p className="text-purple-600 mb-4">
                  Como administrador, tienes acceso a funciones avanzadas para gestionar la plataforma.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link 
                    to="/admin/users" 
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow border border-purple-100"
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">Usuarios</h3>
                        <p className="text-sm text-gray-500">Gestionar usuarios</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link 
                    to="/admin/products" 
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow border border-purple-100"
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">Productos</h3>
                        <p className="text-sm text-gray-500">Administrar inventario</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </Card>
          )}
          
          {/* Acciones rápidas */}
          <Card className="col-span-full bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Añadir producto</span>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Ver ventas</span>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Editar perfil</span>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Ayuda</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 