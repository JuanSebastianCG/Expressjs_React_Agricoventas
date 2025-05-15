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
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-green-1 hover:text-green-0-9 font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Product Image and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image Gallery */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="relative h-[400px] bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img 
                      src={product.images[currentImageIndex]?.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain"
                    />
                    
                    {product.images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 shadow-md text-gray-700"
                          aria-label="Previous image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 shadow-md text-gray-700"
                          aria-label="Next image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Thumbnail indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {product.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-3 h-3 rounded-full ${
                                idx === currentImageIndex ? 'bg-green-1' : 'bg-gray-300'
                              }`}
                              aria-label={`Go to image ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">Imagen no disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details Tabs */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="border-b">
                <div className="flex">
                  <button
                    className={`py-4 px-6 font-medium ${
                      activeTab === 'descripcion'
                        ? 'text-green-1 border-b-2 border-green-1'
                        : 'text-gray-600 hover:text-green-1'
                    }`}
                    onClick={() => setActiveTab('descripcion')}
                  >
                    Descripción
                  </button>
                  <button
                    className={`py-4 px-6 font-medium ${
                      activeTab === 'historial'
                        ? 'text-green-1 border-b-2 border-green-1'
                        : 'text-gray-600 hover:text-green-1'
                    }`}
                    onClick={() => setActiveTab('historial')}
                  >
                    Historial
                  </button>
                  <button
                    className={`py-4 px-6 font-medium ${
                      activeTab === 'resenas'
                        ? 'text-green-1 border-b-2 border-green-1'
                        : 'text-gray-600 hover:text-green-1'
                    }`}
                    onClick={() => setActiveTab('resenas')}
                  >
                    Reseñas ({product.reviewCount || 0})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'descripcion' && (
                  <div className="text-gray-700 whitespace-pre-wrap">
                    <p>{product.description || 'No hay descripción disponible para este producto.'}</p>
                  </div>
                )}

                {activeTab === 'historial' && (
                  <div className="text-gray-700">
                    <p>Historial de precio y disponibilidad no disponible en este momento.</p>
                  </div>
                )}

                {activeTab === 'resenas' && (
                  <div className="text-gray-700">
                    {/* Reviews section */}
                    <ReviewStats 
                      averageRating={product.averageRating || 0}
                      totalReviews={product.reviewCount || 0}
                      ratingDistribution={ratingDistribution}
                    />
                    
                    {/* Review form for authenticated users */}
                    {isAuthenticated && user ? (
                      <ReviewForm 
                        productId={product.id || ''} 
                        userId={user.id || ''}
                        onReviewSubmitted={handleReviewSubmitted}
                      />
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-center border border-yellow-200">
                        <p className="text-yellow-1 font-medium mb-2">
                          Inicia sesión para dejar tu reseña
                        </p>
                        <button
                          onClick={() => navigate('/login', { state: { from: `/product/${product.id}` } })}
                          className="text-green-1 font-medium hover:underline"
                        >
                          Iniciar sesión
                        </button>
                      </div>
                    )}
                    
                    {/* Review list */}
                    <h3 className="text-lg font-semibold mb-4">
                      {reviews.length > 0 ? 'Opiniones de clientes' : 'Aún no hay opiniones'}
                    </h3>
                    <ReviewList reviews={reviews} isLoading={reviewsLoading} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Product info, seller, actions, market insights */}
          <div className="space-y-6">
            {/* Product Info Card */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                
                {product.averageRating && (
                  <div className="mb-3">
                    <StarRating rating={product.averageRating} reviewCount={product.reviewCount} />
                  </div>
                )}
                
                <div className="text-3xl font-bold text-green-1 mb-4">
                  {typeof product.price === 'number' 
                    ? product.price.toLocaleString('es-CO', { 
                        style: 'currency', 
                        currency: 'COP', 
                        minimumFractionDigits: 0 
                      }) 
                    : 'Precio no disponible'}
                  <span className="text-lg text-gray-600 font-medium">/{product.unitMeasure}</span>
                </div>

                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">
                    {product.region || 
                     (product.originLocation ? 
                      `${product.originLocation.city}, ${product.originLocation.department}` : 
                      'No especificado')}
                  </span>
                </div>

                {/* Stock availability with clear messaging */}
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {(
                    // Check for stock using several possible fields and formats
                    (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) || 
                    (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
                    (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
                    (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
                  ) ? (
                    <span className="text-gray-700">
                      Disponible: {product.availableQuantity || product.stockQuantity} {product.unitMeasure}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Sin stock disponible</span>
                  )}
                </div>

                {/* Seller info with badge */}
                <div className="flex items-center justify-between border-t border-b py-4 my-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 overflow-hidden">
                        <span className="text-lg font-semibold text-white">{sellerFullName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{sellerFullName}</p>
                      <div className="flex items-center">
                        <span className="text-xs bg-green-0-5 text-green-1 px-2 py-0.5 rounded-full mr-2">Verificado</span>
                       {/*  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Certificación De producto</span> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons with disabled state when no stock */}
                <div className="space-y-3">
                  <button 
                    onClick={handleAddToCart}
                    disabled={!(
                      (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) ||
                      (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
                      (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
                      (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
                    )}
                    className={`w-full py-3 px-4 ${
                      (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) ||
                      (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
                      (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
                      (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
                        ? 'bg-yellow-1 hover:bg-yellow-1-5 text-gray-800' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } font-medium rounded-md flex items-center justify-center`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {(
                      (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) ||
                      (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
                      (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
                      (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
                    ) ? 'Añadir al carrito' : 'Sin stock disponible'}
                  </button>
                </div>
              </div>
            </div>

            {/* Market Insights */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Insights de mercado</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-0-4 rounded-md">
                    <span className="text-gray-700">Tendencia de precio</span>
                    <span className="font-bold text-green-1">+3.2% this week</span>
                  </div>
                  
                  <div className="p-3 bg-yellow-100 rounded-md">
                    <div className="flex items-start">
                      <span className="text-yellow-1 mr-2">🌦️</span>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Alerta de clima:</span> La siguiente semana se esperan lluvias moderadas
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-100 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Tips de comprador:</span> El mejor momento para comprar granos de café es durante la temporada de cosecha (octubre-diciembre), cuando los precios suelen ser más bajos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
};

export default ProductDetail; 