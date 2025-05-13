import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Header from '../../components/layout/Header';
import { useAppContext } from '../../context/AppContext';
import { IProduct } from '../../interfaces/product';
import api from '../../services/api';
import { certificationService } from '../../services/certificationService';
import UserProfile from '../../components/common/UserProfile';
import ProductFilters from '../../components/products/ProductFilters';
import ProductTips from '../../components/products/ProductTips';
import ProductListView from '../../components/products/ProductListView';
import ProductGridView from '../../components/products/ProductGridView';
import CertificationStatus from '../../components/common/CertificationStatus';

// Enum para los tipos de vista
enum ViewType {
  LIST = 'list',
  GRID = 'grid'
}

const MyProducts: React.FC = () => {
  console.log("🔄 MyProducts Component Rendering");
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  
  // Add debug info
  useEffect(() => {
    console.log("🚀 MyProducts Mounted");
    
    return () => {
      console.log("👋 MyProducts Unmounted");
    };
  }, []);
  
  // Products state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  
  // Certification status
  const [isCertificateChecking, setIsCertificateChecking] = useState(true);
  
  // Filters state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  
  // View state
  const [viewType, setViewType] = useState<ViewType>(ViewType.LIST);
  
  // Product deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add this in the appropriate place - inside the component, before the return statement
  const [canCreateProducts, setCanCreateProducts] = useState(false);

  // Check if user is authenticated and a seller
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Check if user has all required certifications
  useEffect(() => {
    const checkCertifications = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setIsCertificateChecking(true);
          console.log("MyProducts: Fetching certification status...");
          const certificationStatusResponse = await certificationService.verifyUserCertifications(user.id);
          console.log("MyProducts: Received status response:", certificationStatusResponse);

          // Safely access hasAllCertifications and certificationsCount
          // Cast to any to handle potential nested .data layer from API client/interceptors
          const responseAsAny = certificationStatusResponse as any;
          const statusData = responseAsAny.data; // Attempt to access potential nested .data
          
          const hasAll = statusData?.hasAllCertifications ?? responseAsAny?.hasAllCertifications;
          const counts = statusData?.certificationsCount ?? responseAsAny?.certificationsCount;
          
          console.log("MyProducts: Extracted hasAll:", hasAll);
          console.log("MyProducts: Extracted counts:", counts);

          if (typeof hasAll === 'boolean') {
            setCanCreateProducts(hasAll);
            
            if (!hasAll) {
              console.log("MyProducts: User doesn't have all required certifications. Add Product button will be disabled.");
            }
          } else {
             console.warn("MyProducts: hasAllCertifications property missing or invalid in response:", certificationStatusResponse);
             setCanCreateProducts(false);
             alert('No se pudo verificar el estado de tus certificaciones. Por favor, intenta de nuevo más tarde.');
             navigate('/dashboard');
          }
        } catch (err: any) {
          console.error("MyProducts: Error checking user certifications:", err);
          const errorMessage = err.response?.data?.error || err.message || 'Error desconocido al verificar certificados.';
          alert(`Error al verificar certificaciones: ${errorMessage}`);
          setCanCreateProducts(false);
        } finally {
          setIsCertificateChecking(false);
        }
      }
    };
    
    checkCertifications();
  }, [isAuthenticated, user, navigate]);

  // Fetch user's products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching products for user:", user?.id);
      
      // Use a slight delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await api.get('/api/products', {
        params: { sellerId: user?.id }
      });
      
      if (response.data.success) {
        console.log("Products fetched successfully:", response.data);
        const productsData = Array.isArray(response.data.data) ? response.data.data : [];
        setProducts(productsData);
        setFilteredProducts(productsData);
        setTotalProductsCount(response.data.total || productsData.length);
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

  // Retry fetching products if there was an error
  const retryFetch = () => {
    setError(null);
    fetchProducts();
  };

  // Load products on mount - with safety flag
  useEffect(() => {
    // Skip initial mount cycle
    const isFirstLoad = sessionStorage.getItem('is_loading_products');
    
    // Only fetch products if certificate check is done and user has all required certificates
    if (!isFirstLoad && isAuthenticated && user?.id && !isCertificateChecking) {
      sessionStorage.setItem('is_loading_products', 'true');
      console.log("Starting product fetch with delay...");
      
      // Add extra delay to ensure authentication is properly initialized
      setTimeout(() => {
        fetchProducts();
      }, 300);
    } else {
      console.log("Skipping immediate product fetch");
    }
    
    return () => {
      sessionStorage.removeItem('is_loading_products');
    };
  }, [isAuthenticated, user, isCertificateChecking]);

  // Apply filters when filter values change
  useEffect(() => {
    if (products.length > 0) {
      let result = [...products];
      
      if (categoryFilter) {
        result = result.filter(product => product.category === categoryFilter);
      }
      
      if (regionFilter) {
        result = result.filter(product => product.region === regionFilter);
      }
      
      if (qualityFilter) {
        result = result.filter(product => product.quality === qualityFilter);
      }
      
      setFilteredProducts(result);
    }
  }, [products, categoryFilter, regionFilter, qualityFilter]);

  // Toggle view type
  const toggleViewType = () => {
    setViewType(prevType => prevType === ViewType.LIST ? ViewType.GRID : ViewType.LIST);
  };

  // Handle product creation
  const handleCreateProduct = () => {
    navigate('/crear-producto');
  };

  // Handle product editing
  const handleEditProduct = (productId: string) => {
    navigate(`/editar-producto/${productId}`);
  };

  // Handle view product details
  const handleViewDetails = (productId: string) => {
    // Navigate to product details page or show a modal
    console.log(`View details for product ${productId}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    if (!isDeleting) {
      setProductToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await api.delete(`/api/products/${productToDelete}`);
      
      if (response.data.success) {
        // Remove the deleted product from the local state
        setProducts(prev => prev.filter(product => product.id !== productToDelete));
        setTotalProductsCount(prev => prev - 1);
        closeDeleteModal();
      } else {
        throw new Error(response.data.error?.message || 'Error al eliminar el producto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el producto');
      console.error('Error deleting product:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
              <p className="text-gray-1">Gestiona tus productos y agrega nuevos listados</p>
            </div>
            <Link to="/dashboard" className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors">
              Volver al Dashboard
            </Link>
          </div>
        </div>

        {/* Certification Status Check */}
        {user?.id && <CertificationStatus userId={user.id} className="mb-6" />}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content */}
          <div className="md:w-3/4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              {/* Filters */}
              <div className="flex-grow mb-4 sm:mb-0">
                <ProductFilters
                  onCategoryChange={setCategoryFilter}
                  onRegionChange={setRegionFilter}
                  onQualityChange={setQualityFilter}
                  selectedCategory={categoryFilter}
                  selectedRegion={regionFilter}
                  selectedQuality={qualityFilter}
                />
              </div>

            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm leading-5 font-medium">
                      {error === 'Network Error' 
                        ? 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.'
                        : `Error al cargar los productos: ${error}`
                      }
                    </p>
                    <p className="text-xs mt-1 mb-2">
                      No te preocupes, puedes intentar de nuevo o contactar a soporte si el problema persiste.
                    </p>
                    <button 
                      onClick={retryFetch}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add new product button */}
            <div className="mb-6">
              {canCreateProducts ? (
                <button
                  onClick={handleCreateProduct}
                  className="flex items-center justify-center bg-green-1 hover:bg-green-0-9 text-white py-3 px-4 rounded shadow-sm transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Nuevo Producto
                </button>
              ) : (
                <div className="bg-yellow-100 border-l-4 border-yellow-1 text-yellow-1 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        Para poder agregar productos, primero necesitas tener todas tus certificaciones verificadas.
                      </p>
                      <p className="mt-2">
                        <button
                          onClick={() => navigate('/certificados')}
                          className="bg-yellow-1 hover:bg-yellow-1-5 text-white py-1 px-3 rounded text-sm transition-colors"
                        >
                          Completar certificaciones
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
              </div>
            ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-1 text-lg mb-4">No tienes productos registrados.</p>
                {canCreateProducts && (
                  <button
                    onClick={handleCreateProduct}
                    className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
                  >
                    Crear tu primer producto  
                  </button>
                )}

              </Card>
            ) : (
              viewType === ViewType.LIST ? (
                <ProductListView
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={openDeleteModal}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <ProductGridView
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={openDeleteModal}
                  onViewDetails={handleViewDetails}
                />
              )
            )}
          </div>

          {/* Sidebar */}
          <div className="md:w-1/4">
            {/* User Profile & Stats */}
            <Card className="mb-6 p-4">
              <UserProfile user={user} variant="basic" showActions={false} />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-1">Total de productos</p>
                <p className="text-2xl font-bold text-green-1">{totalProductsCount}</p>
              </div>
            </Card>

            {/* Tips */}
            <ProductTips />
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Eliminar Producto"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-0-5"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteProduct}
              className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <p className="text-gray-700">
          ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
};

export default MyProducts; 