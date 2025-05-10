import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Header from '../components/layout/Header';
import { useAppContext } from '../context/AppContext';
import { IProduct } from '../interfaces/product';
import api from '../services/api';
import UserProfile from '../components/common/UserProfile';
import SellerCard from '../components/common/SellerCard';

interface Seller {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  userType: string;
  profileImage?: string;
}

const SellerProfile: React.FC = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerRating, setSellerRating] = useState<number | null>(null);

  // Fetch seller data and products
  useEffect(() => {
    if (!sellerId) {
      navigate('/mercado-general');
      return;
    }

    const fetchSellerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch seller info
        const sellerResponse = await api.get(`/api/users/${sellerId}`);
        if (sellerResponse.data.success) {
          setSeller(sellerResponse.data.data);
        } else {
          throw new Error('Error al cargar información del vendedor');
        }

        // Fetch seller products
        const productsResponse = await api.get('/api/products', {
          params: { sellerId }
        });
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data);
        } else {
          throw new Error('Error al cargar productos del vendedor');
        }

        // Fetch seller rating (mock for now)
        setSellerRating(4.5); // This would come from an API call in a real scenario
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos del vendedor');
        console.error('Error fetching seller data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, navigate]);

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
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Seller Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                {seller && (
                  <SellerCard 
                    seller={seller} 
                    productCount={products.length} 
                    rating={sellerRating || undefined}
                    showContact={true}
                    className="sticky top-4"
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <Card>
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {seller?.firstName && seller?.lastName 
                        ? `Productos de ${seller.firstName} ${seller.lastName}`
                        : `Productos de ${seller?.username || 'Vendedor'}`}
                    </h1>
                    <p className="text-gray-1">
                      {products.length} {products.length === 1 ? 'producto' : 'productos'} disponibles
                    </p>
                  </div>

                  {/* Filter options could go here */}
                  
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-1 text-lg">Este vendedor no tiene productos disponibles.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {products.map((product) => (
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
                            <div className="mb-2">
                              <span className="text-sm text-gray-1">Categoría: {product.category}</span>
                            </div>
                          </div>

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
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SellerProfile; 