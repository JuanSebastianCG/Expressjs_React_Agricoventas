import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { IProduct, ProductFilters } from '../interfaces/product';
import api from '../services/api';
import Header from '../components/layout/Header';
import UserProfile from '../components/common/UserProfile';

interface Seller {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
  profileImage?: string;
}

interface ProductWithSeller extends IProduct {
  seller?: Seller;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Construct query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.region) queryParams.append('region', filters.region);
      if (filters.quality) queryParams.append('quality', filters.quality);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

      const response = await api.get(`/api/products?${queryParams.toString()}`);
      
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalProducts(response.data.total || response.data.data.length);
      } else {
        throw new Error(response.data.error?.message || 'Error al cargar productos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterName: keyof ProductFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const addToFavorites = (productId: string) => {
    console.log(`Added product ${productId} to favorites`);
    // Implement favorites functionality
  };

  const addToCart = (productId: string) => {
    console.log(`Added product ${productId} to cart`);
    // Implement cart functionality
  };

  return (
    <>
      <Header />
      <div className="bg-green-1 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Bienvenido a tu mercado agrícola</h1>
          <p className="mt-2">Compra y vende directamente con productores</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <select
              className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Categoría</option>
              <option value="Frutas">Frutas</option>
              <option value="Verduras">Verduras</option>
              <option value="Granos">Granos</option>
              <option value="Café">Café</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <select
              className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
              value={filters.region || ''}
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="">Región</option>
              <option value="Antioquia">Antioquia</option>
              <option value="Nariño">Nariño</option>
              <option value="Cundinamarca">Cundinamarca</option>
              <option value="Valle">Valle</option>
              <option value="Cauca">Cauca</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <select
              className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
              value={filters.quality || ''}
              onChange={(e) => handleFilterChange('quality', e.target.value)}
            >
              <option value="">Calidad</option>
              <option value="Premium">Premium</option>
              <option value="Estándar">Estándar</option>
              <option value="Económico">Económico</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <select
              className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
              value={filters.sortBy || ''}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="">Ordenar por</option>
              <option value="price_asc">Precio: Menor a mayor</option>
              <option value="price_desc">Precio: Mayor a menor</option>
              <option value="name_asc">Nombre: A-Z</option>
              <option value="name_desc">Nombre: Z-A</option>
            </select>
          </div>
        </div>

        {/* Products count */}
        <div className="mb-4 text-sm text-gray-1">
          {totalProducts} productos disponibles
        </div>

        {/* Loading and error states */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Products grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <Card key={product.id} className="relative">
                  {/* Favorite button */}
                  <button 
                    className="absolute top-4 right-4 text-gray-0-5 hover:text-yellow-1"
                    onClick={() => addToFavorites(product.id || '')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Product image */}
                  <div className="aspect-w-16 aspect-h-9 mb-4 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
                        <span className="text-gray-500">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-green-1 font-bold text-xl mb-2">
                      ${product.price.toLocaleString('es-CO')} COP/{product.unitMeasure}
                    </p>
                    <div className="mb-2">
                      <span className="text-sm text-gray-1">Región: {product.region}</span>
                    </div>
                  </div>

                  {/* Seller info */}
                  {product.seller && (
                    <div className="border-t border-gray-0-5 mt-3 pt-3">
                      <UserProfile 
                        user={product.seller} 
                        variant="basic" 
                        showActions={true}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex-1 bg-green-0-5 hover:bg-green-0-6 text-green-1 py-2 px-4 rounded transition-colors"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => addToCart(product.id || '')}
                      className="flex-1 bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded transition-colors"
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-1 text-lg">No se encontraron productos que coincidan con los filtros seleccionados.</p>
              </div>
            )}
          </div>
        )}

        {/* Load more button */}
        {products.length > 0 && products.length < totalProducts && (
          <div className="mt-8 text-center">
            <button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md"
              onClick={() => console.log('Load more products')}
            >
              Cargar más productos
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Marketplace; 