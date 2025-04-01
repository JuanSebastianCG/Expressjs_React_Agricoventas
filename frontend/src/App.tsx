import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';

// Protector de rutas para páginas que requieren autenticación
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          {/* Páginas públicas */}
          <Route path="acerca-de" element={<div className="p-4">Página Acerca de</div>} />
          <Route path="productos" element={<div className="p-4">Página de Productos</div>} />
          
          {/* Páginas privadas */}
          <Route 
            path="perfil" 
            element={
              <PrivateRoute>
                <div className="p-4">Perfil de Usuario</div>
              </PrivateRoute>
            } 
          />
          
          {/* Página 404 */}
          <Route path="*" element={<div className="p-4">Página no encontrada</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
