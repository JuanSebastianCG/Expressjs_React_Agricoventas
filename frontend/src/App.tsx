import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';

// Componente de ejemplo con Tailwind 4
const Home = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h1 className="text-3xl font-bold text-primary-600 mb-4">
        Bienvenido a Agricoventas
      </h1>
      <p className="text-gray-600 mb-6">
        La plataforma que conecta productores agrícolas con compradores.
      </p>
      <button className=" text-white font-bold py-2 px-6 rounded-md">
        Explorar Productos
      </button>
    </div>
  </div>
);

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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<div>Página de Login</div>} />
        
        {/* Ruta privada de ejemplo */}
        <Route 
          path="/perfil" 
          element={
            <PrivateRoute>
              <div>Perfil de Usuario</div>
            </PrivateRoute>
          } 
        />
        
        {/* Página 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
