import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const NotFound: React.FC = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-red-1 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Página No Encontrada</h2>
          <p className="text-gray-600 mb-6">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <div className="space-y-3">
            <Link
              to="/"
              className="block bg-green-1 hover:bg-green-0-9 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Volver al Inicio
            </Link>
            <Link
              to="/mercado-general"
              className="block bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Ir al Mercado
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound; 