import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/user/Perfil';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Marketplace from './pages/Marketplace';
import ProductCreate from './pages/products/ProductCreate';
import MyProducts from './pages/products/MyProducts';
import MyOrders from './pages/orders/MyOrders';
import UploadCertificate from './pages/user/UploadCertificate';
import CertificationApproval from './pages/admin/CertificationApproval';
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

// Componente para rutas protegidas de vendedores
const SellerRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppContext();
  
  console.log("SellerRoute - isAuthenticated:", isAuthenticated);
  console.log("SellerRoute - user:", JSON.stringify(user));
  console.log("SellerRoute - userType:", user?.userType);
  
  if (!isAuthenticated) {
    console.log("SellerRoute - Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Solo permitir vendedores o administradores
  if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
    console.log("SellerRoute - Not a seller or admin, redirecting to dashboard");
    console.log("SellerRoute - User type comparison:", {
      userType: user?.userType,
      isSELLER: user?.userType === 'SELLER',
      isADMIN: user?.userType === 'ADMIN'
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log("SellerRoute - Access granted");
  return <>{children}</>;
};

// Add a utility function for navigation that can be imported by other components
export const navigateToProducts = () => {
  console.log("FORCE NAVIGATION: Redirecting to products page");
  // Force hard navigation by setting window.location
  window.location.href = '/mis-productos';
};

const App: React.FC = () => {
  const { isAuthenticated } = useAppContext();

  useEffect(() => {
    // Add a global click handler for mis-productos links
    const handleProductsNavigation = (e: any) => {
      const target = e.target as HTMLElement;
      
      // Check if the click target is a products link or inside one
      const isProductLink = (el: HTMLElement): boolean => {
        if (!el) return false;
        if (el.tagName === 'A' && el.getAttribute('href') === '/mis-productos') return true;
        if (el.tagName === 'BUTTON' && el.dataset.nav === 'products') return true;
        return false;
      };
      
      // Check if target or parents is a products link
      let currentEl: HTMLElement | null = target;
      let isProdsLink = false;
      
      while (currentEl && !isProdsLink) {
        isProdsLink = isProductLink(currentEl);
        currentEl = currentEl.parentElement;
      }
      
      if (isProdsLink) {
        console.log("Global handler: Intercepted navigation to /mis-productos");
        e.preventDefault();
        navigateToProducts();
      }
    };
    
    document.addEventListener('click', handleProductsNavigation);
    return () => document.removeEventListener('click', handleProductsNavigation);
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mercado-general" element={<Marketplace />} />
        
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

        <Route path="/perfil/:userId" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        
        {/* Rutas para certificados */}
        <Route path="/certificados" element={
          <ProtectedRoute>
            <UploadCertificate />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/certificados" element={
          <ProtectedRoute requiredRole="ADMIN">
            <CertificationApproval />
          </ProtectedRoute>
        } />
        
        {/* Rutas para vendedores */}
        <Route path="/mis-productos" element={<MyProducts />} />
        
        <Route path="/crear-producto" element={
          <SellerRoute>
            <ProductCreate />
          </SellerRoute>
        } />
        
        <Route path="/editar-producto/:productId" element={
          <SellerRoute>
            <ProductCreate />
          </SellerRoute>
        } />
        
        {/* Rutas para pedidos */}
        <Route path="/mis-pedidos" element={
          <ProtectedRoute>
            <MyOrders />
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
          <Route path="certifications" element={<ProtectedRoute requiredRole="ADMIN"><CertificationApproval /></ProtectedRoute>} />
          
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
