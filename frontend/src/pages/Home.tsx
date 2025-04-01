import Button from '../components/ui/Button';

const Home = () => {
  return (
    <div className="space-y-8">
      <section className="text-center py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Bienvenido a Agricoventas
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          La plataforma que conecta productores agrícolas con compradores. Encuentra los mejores productos frescos directamente de los agricultores.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg">Explorar Productos</Button>
          <Button variant="outline" size="lg">Conocer más</Button>
        </div>
      </section>

      <section className="py-12 bg-white rounded-lg shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Categorías Destacadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Frutas', 'Verduras', 'Granos'].map((category) => (
              <div key={category} className="card text-center hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gray-200 rounded-t-lg mb-4"></div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{category}</h3>
                <p className="text-gray-600 mb-4">
                  Productos frescos de la mejor calidad
                </p>
                <Button variant="ghost">Ver productos</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            ¿Por qué Agricoventas?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Productos Frescos',
                description: 'Conectamos directamente con agricultores locales para garantizar la frescura.'
              },
              {
                title: 'Precios Justos',
                description: 'Al eliminar intermediarios, obtienes mejores precios y los productores ganan más.'
              },
              {
                title: 'Apoyo Local',
                description: 'Apoya a los agricultores de tu región y contribuye a la economía local.'
              }
            ].map((feature, index) => (
              <div key={index} className="card">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
