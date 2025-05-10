import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import './index.css';

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAppContext();
  
  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }
  
  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && user?.userType !== requiredRole) {
    // Redirigir al dashboard general
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAppContext();

  useEffect(() => {
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas para usuarios regulares */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/perfil" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas para administradores */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }>
          {/* Rutas anidadas dentro del dashboard de administración */}
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          {/* Aquí se añadirán más rutas como productos, categorías, etc. */}
          
          {/* Ruta para manejar rutas no encontradas dentro de admin */}
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Route>
        
        {/* Ruta para manejar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
