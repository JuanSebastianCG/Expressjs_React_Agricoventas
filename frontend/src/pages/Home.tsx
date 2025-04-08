import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';

// Componente de Característica reutilizable
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <Card className="shadow-md">
      <div className="text-center p-6">
        <div className="inline-flex items-center justify-center p-4 bg-green-0-5 rounded-full text-green-1 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-blue-3">{title}</h3>
        <p className="text-gray-1">
          {description}
        </p>
      </div>
    </Card>
  );
};

const Home: React.FC = () => {
  // Datos para las características
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Transparencia de Precios",
      description: "Consulta tarifas actualizadas cada 20 minutos y ve tendencias históricas."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Soporte y Capacitación",
      description: "Accede a tips agrícolas, alertas climáticas y asesoría financiera básica."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Conexión Directa",
      description: "Negocia sin intermediarios. Más ingresos para productores y ahorro para compradores."
    }
  ];

  return (
    <MainLayout title="Agricoventas">
      {/* Hero Section */}
      <div className="bg-green-0-5/30 w-full">
        <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-3 mb-4">
              Conectando el Campo Colombiano con el Futuro Digital
            </h1>
            <p className="text-gray-1 mb-8">
              Unimos agricultores y compradores directamente, eliminando intermediarios y garantizando precios justos para todos.
            </p>
            <div className="flex gap-4">
              <a 
                href="/register"
                className="bg-green-1 hover:bg-green-0-9 text-white font-medium py-3 px-6 rounded transition-colors"
              >
                ¡Empieza a Vender!
              </a>
              <a 
                href="/mercado-general"
                className="border border-green-1 text-green-1 hover:bg-green-0-5/30 font-medium py-3 px-6 rounded transition-colors"
              >
                Explora el Mercado
              </a>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://placehold.co/800x600/046B4D/FFFFFF?text=Agricultor+Digital" 
              alt="Agricultor usando tecnología" 
              className="rounded-lg w-full h-auto"
            />
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home; 