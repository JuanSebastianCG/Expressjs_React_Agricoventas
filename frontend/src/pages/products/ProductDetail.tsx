import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IProduct } from '../../interfaces/product';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import { useAppContext } from '../../context/AppContext';
import ReviewList, { ReviewItem } from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewStats from '../../components/reviews/ReviewStats';
import ProductHistoryList from '../../components/products/ProductHistoryList';
import { useCart } from '../../context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StarRating: React.FC<{ rating: number, reviewCount?: number }> = ({ rating, reviewCount }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`star-full-${i}`} className="w-5 h-5 text-yellow-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {hasHalfStar && (
        <div className="relative">
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <svg className="w-5 h-5 text-yellow-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      )}
      
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`star-empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {reviewCount !== undefined && (
        <span className="ml-2 text-sm font-medium text-gray-600">({reviewCount} reseñas)</span>
      )}
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  const { addItem } = useCart();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'descripcion' | 'historial' | 'resenas'>('descripcion');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Review related state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<{ [key: number]: number }>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  // Integrar un estado para controlar la visualización del historial
  const [showHistory, setShowHistory] = useState(false);

  // Calculate rating distribution from reviews
  const calculateRatingDistribution = (reviewsList: ReviewItem[]) => {
    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviewsList.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[Math.floor(review.rating)] = (distribution[Math.floor(review.rating)] || 0) + 1;
      }
    });
    
    return distribution;
  };

  // Function to fetch product reviews
  const fetchReviews = async () => {
    if (!productId) return;
    
    try {
      setReviewsLoading(true);
      const response = await api.get(`/reviews/product/${productId}`);
      
      if (response.data.success && response.data.data) {
        const reviewData = response.data.data.reviews || [];
        setReviews(reviewData);
        setRatingDistribution(calculateRatingDistribution(reviewData));
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/products/${productId}`);
        if (response.data.success && response.data.data) {
          setProduct(response.data.data);
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch product details');
        }
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [productId]);

  const nextImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if there is available stock using various potential field names and formats
    const hasStock = (
      (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) ||
      (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
      (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
      (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
    );
    
    if (!hasStock) {
      toast.error('Este producto no tiene stock disponible');
      return;
    }
    
    // Determine the actual stock amount
    const stockAmount = (
      typeof product.availableQuantity === 'number' ? product.availableQuantity :
      typeof product.stockQuantity === 'number' ? product.stockQuantity :
      product.availableQuantity ? parseInt(String(product.availableQuantity)) :
      product.stockQuantity ? parseInt(String(product.stockQuantity)) :
      0
    );
    
    try {
      // Create a cart item from the product data
      const success = addItem({
        productId: product.id || '',
        name: product.name,
        price: product.price,
        quantity: 1, // Default quantity
        unitMeasure: product.unitMeasure || 'unidad',
        imageUrl: product.images?.[0]?.imageUrl || '', // First image URL if available
        sellerName: product.seller ? 
          `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 
          ((product.seller as any)?.username || 'Vendedor') : 
          'Vendedor',
        stockQuantity: stockAmount
      });
      
      if (success) {
        // Show success message and navigate to cart
        toast.success('Producto añadido al carrito');
        navigate('/carrito');
      } else {
        toast.error('No se pudo añadir el producto. Stock insuficiente.');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error('No se pudo añadir el producto al carrito');
    }
  };

  // Handle review submission complete
  const handleReviewSubmitted = () => {
    fetchReviews();
    // Also update product rating if needed
    if (productId) {
      api.get(`/products/${productId}`)
        .then(response => {
          if (response.data.success) {
            setProduct(response.data.data);
          }
        })
        .catch(err => console.error('Error refreshing product data:', err));
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-1 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Cargando detalles del producto...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="p-8 bg-red-50">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <StyledButton onClick={() => navigate('/')} variant="primary">
              Volver al Inicio
            </StyledButton>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Producto no encontrado</h2>
            <p className="text-gray-600 mb-6">El producto que estás buscando no existe o no está disponible.</p>
            <StyledButton onClick={() => navigate('/')} variant="primary">
              Explorar Productos
            </StyledButton>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const sellerFullName = product.seller ? 
    `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 
    ((product.seller as any)?.username || 'Vendedor') : 
    'Vendedor';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            <p className="ml-4 text-lg text-gray-600">Cargando producto...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-1 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product images */}
            <div className="relative">
              <div className="bg-white rounded-lg overflow-hidden shadow-md aspect-square">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[currentImageIndex]?.imageUrl || ''}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">No hay imagen disponible</p>
                  </div>
                )}
                
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md focus:outline-none hover:bg-gray-100"
                    >
                      <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md focus:outline-none hover:bg-gray-100"
                    >
                      <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail navigation */}
              {product.images && product.images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-green-1' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <StarRating 
                  rating={product.averageRating || 0} 
                  reviewCount={product.reviewCount || reviews.length} 
                />
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-green-1">
                  {typeof product.price === 'number' 
                    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)
                    : 'Precio no disponible'
                  }
                </span>
                <span className="text-sm text-gray-600 ml-2">por {product.unitMeasure || 'unidad'}</span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-1 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-gray-700">
                    Stock: <span className="font-medium">{product.stockQuantity || 0} {product.unitMeasure || 'unidades'}</span>
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-1 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">
                    Origen: <span className="font-medium">{product.originLocation?.city || 'No especificado'}</span>
                  </span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-1 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-700">
                    Vendedor: <span className="font-medium">
                      {product.seller 
                        ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || ((product.seller as any)?.username || 'Vendedor anónimo')
                        : 'Vendedor anónimo'
                      }
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <StyledButton 
                  onClick={handleAddToCart}
                  disabled={!product.stockQuantity || product.stockQuantity <= 0}
                  className="w-full md:w-auto"
                >
                  {product.stockQuantity && product.stockQuantity > 0 
                    ? 'Agregar al carrito' 
                    : 'Sin stock disponible'
                  }
                </StyledButton>
              </div>
              
              {/* Tabs for description, history, and reviews */}
              <div className="border-b border-gray-200 mb-4">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('descripcion')}
                    className={`py-2 relative ${
                      activeTab === 'descripcion'
                        ? 'text-green-1 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Descripción
                    {activeTab === 'descripcion' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-1"></span>
                    )}
                  </button>
                  
                  {/* Botón para ver historial - solo para vendedores y admins */}
                  {(user?.userType === 'SELLER' || user?.userType === 'ADMIN') && (
                    <button
                      onClick={() => setActiveTab('historial')}
                      className={`py-2 relative ${
                        activeTab === 'historial'
                          ? 'text-green-1 font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Historial
                      {activeTab === 'historial' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-1"></span>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('resenas')}
                    className={`py-2 relative ${
                      activeTab === 'resenas'
                        ? 'text-green-1 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reseñas ({reviews.length})
                    {activeTab === 'resenas' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-1"></span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Tab content */}
              <div>
                {activeTab === 'descripcion' && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{product.description || 'No hay descripción disponible.'}</p>
                  </div>
                )}
                
                {activeTab === 'historial' && (user?.userType === 'SELLER' || user?.userType === 'ADMIN') && (
                  <div>
                    <ProductHistoryList productId={product.id || ''} />
                  </div>
                )}
                
                {activeTab === 'resenas' && (
                  <div>
                    <ReviewStats 
                      averageRating={product.averageRating || 0} 
                      totalReviews={reviews.length} 
                      ratingDistribution={ratingDistribution}
                    />
                    
                    {isAuthenticated ? (
                      <div className="mt-6">
                        <ReviewForm 
                          productId={product.id || ''} 
                          onReviewSubmitted={handleReviewSubmitted} 
                        />
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-700">
                          Inicia sesión para dejar una reseña sobre este producto.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Reseñas de clientes</h3>
                      {reviewsLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-1"></div>
                          <p className="ml-3 text-gray-600">Cargando reseñas...</p>
                        </div>
                      ) : reviews.length > 0 ? (
                        <ReviewList reviews={reviews} />
                      ) : (
                        <p className="text-gray-500">Aún no hay reseñas para este producto.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró el producto solicitado.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail; 