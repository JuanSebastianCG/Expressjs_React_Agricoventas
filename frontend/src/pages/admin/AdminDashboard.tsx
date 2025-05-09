import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppContext();
  const [activeTab, setActiveTab] = useState('users');

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Manejar cambio de pestaña
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/admin/${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <div>
              <span className="mr-2 text-sm text-gray-600">
                {user?.fullName} ({user?.role})
              </span>
              <Link 
                to="/dashboard" 
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'users' 
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('users')}
            >
              Usuarios
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'products' 
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('products')}
            >
              Productos
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'orders' 
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('orders')}
            >
              Pedidos
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'categories' 
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('categories')}
            >
              Categorías
            </button>
          </div>
        </div>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 