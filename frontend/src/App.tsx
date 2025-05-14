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
import ManageCategories from './pages/admin/ManageCategories';
import ProductDetail from './pages/products/ProductDetail';
import NotFound from './pages/NotFound';
// import UserCertifications from './pages/user/UserCertifications';
import './index.css';
import { CartProvider } from './context/CartContext';

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
  
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Solo permitir vendedores o administradores
  if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {

    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Add a utility function for navigation that can be imported by other components
export const navigateToProducts = () => {
  // Force hard navigation by setting window.location
  window.location.href = '/productos';
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
        if (el.tagName === 'A' && el.getAttribute('href') === '/productos') return true;
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
        e.preventDefault();
        navigateToProducts();
      }
    };
    
    document.addEventListener('click', handleProductsNavigation);
    return () => document.removeEventListener('click', handleProductsNavigation);
  }, [isAuthenticated]);

  return (
    <Router>
      <CartProvider>
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
          <Route path="/productos" element={
            <SellerRoute>
              <MyProducts />
            </SellerRoute>
          } />
          
          {/* Ruta adicional para mis-productos que redirige a /productos */}
          <Route path="/mis-productos" element={<Navigate to="/productos" replace />} />
          
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
          
          <Route path="/product/:productId" element={<ProductDetail />} />
          
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
            <Route path="certifications" element={<CertificationApproval />} />
            <Route path="products" element={<React.Fragment>Gestión de Productos</React.Fragment>} />
            <Route path="orders" element={<React.Fragment>Gestión de Pedidos</React.Fragment>} />
            <Route path="categories" element={<ManageCategories />} />
            
            {/* Ruta para manejar rutas no encontradas dentro de admin */}
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </Route>
          
          {/* Ruta para manejar rutas no encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </Router>
  );
};

export default App;
