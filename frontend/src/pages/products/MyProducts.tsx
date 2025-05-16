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
import ProductListView from '../../components/products/ProductListView';
import ProductGridView from '../../components/products/ProductGridView';

// Enum for view types
enum ViewType {
  LIST = 'list',
  GRID = 'grid'
}

// Simple filter interface
interface ProductFilters {
  category: string;
  region: string;
}

const MyProducts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAppContext();
  
  // Products state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  
  // Certification status
  const [isCertificateChecking, setIsCertificateChecking] = useState(true);
  const [canCreateProducts, setCanCreateProducts] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({
    category: '',
    region: ''
  });
  
  // View state
  const [viewType, setViewType] = useState<ViewType>(ViewType.LIST);
  
  // Product deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is authenticated and a seller - only after auth state is fully loaded
  useEffect(() => {
    // Wait until authentication is done loading
    if (isAuthLoading) {
      return;
    }
    
    // Only run the redirection logic when auth is fully loaded
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Allow any authenticated user to view their products
    // if (user && user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
    //   navigate('/dashboard');
    // }
  }, [isAuthenticated, user, navigate, isAuthLoading]);

  // Check if user has all required certifications
  useEffect(() => {
    const checkCertifications = async () => {
      // Only run if authenticated and user exists
      if (isAuthenticated && user?.id && !isAuthLoading) {
        try {
          setIsCertificateChecking(true);
          
          const certificationStatus = await certificationService.verifyUserCertifications(user.id);
          
          // Determine if user can create products (admin always can)
          if (user.userType === 'ADMIN') {
            setCanCreateProducts(true);
          } else {
            setCanCreateProducts(certificationStatus.hasAllCertifications);
          }
        } catch (err: any) {
          console.error("Error checking user certifications:", err);
          setError("No se pudo verificar el estado de tus certificaciones. Por favor, intenta más tarde.");
          setCanCreateProducts(false);
        } finally {
          setIsCertificateChecking(false);
        }
      }
    };
    
    checkCertifications();
  }, [isAuthenticated, user, navigate, isAuthLoading]);

  // Fetch user's products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user?.id) {
        throw new Error("No se pudo identificar al usuario");
      }
      
      const response = await api.get('/products', {
        params: { sellerId: user.id }
      });
      
      if (response.data.success) {
        let productsData: IProduct[] = [];
        
        if (Array.isArray(response.data.data.products)) {
          productsData = response.data.data.products;
        } else if (Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        setTotalProductsCount(response.data.data.pagination?.total || productsData.length);
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

  // Load products on mount - only after auth checks and certification check
  useEffect(() => {
    // Only fetch products when auth is loaded, user exists, and certificate check is complete
    if (isAuthenticated && user?.id && !isCertificateChecking && !isAuthLoading) {
      fetchProducts();
    }
  }, [isAuthenticated, user, isCertificateChecking, isAuthLoading]);

  // Apply filters when filter values change
  useEffect(() => {
    if (products.length > 0) {
      let result = [...products];
      
      if (filters.category) {
        result = result.filter(product => 
          product.category && product.category.name === filters.category
        );
      }
      
      if (filters.region) {
        result = result.filter(product => 
          product.region === filters.region ||
          (product.originLocation && product.originLocation.department === filters.region)
        );
      }
      
      setFilteredProducts(result);
    }
  }, [products, filters]);

  // Handle filter changes
  const handleFilterChange = (name: keyof ProductFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    navigate(`/productos/${productId}`);
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
      const response = await api.delete(`/products/${productToDelete}`);
      
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

  // Show loading state when auth is still being determined
  if (isAuthLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
            <p className="text-gray-1">Gestiona tus productos y agrega nuevos listados</p>
          </div>
          <Link to="/dashboard" className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors">
            Volver al Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content */}
          <div className="md:w-3/4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full sm:w-auto">
                <select
                  className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas las categorías</option>
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
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="">Todas las regiones</option>
                  <option value="Antioquia">Antioquia</option>
                  <option value="Nariño">Nariño</option>
                  <option value="Cundinamarca">Cundinamarca</option>
                  <option value="Valle">Valle</option>
                  <option value="Cauca">Cauca</option>
                </select>
              </div>

              <div className="w-full sm:w-auto ml-auto">
                <button
                  onClick={toggleViewType}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md"
                >
                  {viewType === ViewType.LIST ? (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      Lista
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                      </svg>
                      Cuadrícula
                    </span>
                  )}
                </button>
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
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {error}
                    </p>
                    <button 
                      onClick={retryFetch}
                      className="text-xs mt-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add new product button */}
            <div className="mb-6">
              <button
                onClick={handleCreateProduct}
                className={`flex items-center justify-center py-3 px-4 rounded shadow-sm transition-colors ${
                  canCreateProducts 
                    ? 'bg-green-1 hover:bg-green-0-9 text-white cursor-pointer' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!canCreateProducts}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Nuevo Producto
              </button>
              
              {!canCreateProducts && (
                <p className="text-sm text-yellow-1 mt-2">
                  Para crear productos, necesitas tener tus certificaciones verificadas.
                  <Link to="/certificados" className="ml-2 underline">Completar certificaciones</Link>
                </p>
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
              
              {/* Certification Status */}
              {!canCreateProducts && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-yellow-1">Estado de certificaciones</p>
                  <p className="text-sm mt-1">Necesitas completar tus certificaciones para publicar productos.</p>
                  <Link 
                    to="/certificados" 
                    className="mt-2 inline-block bg-yellow-1 hover:bg-yellow-1-5 text-white text-sm py-1 px-3 rounded"
                  >
                    Completar Certificaciones
                  </Link>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Acciones rápidas</p>
                <div className="space-y-2">
                  <Link to="/dashboard" className="flex items-center text-sm text-green-1 hover:text-green-0-9">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    Volver al Dashboard
                  </Link>
                  <Link to="/certificados" className="flex items-center text-sm text-green-1 hover:text-green-0-9">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Gestionar Certificaciones
                  </Link>
                </div>
              </div>
            </Card>
            
            {/* Tips Card */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips para Mejores Ventas</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-1">
                      Agrega imágenes claras y de alta calidad de tus productos
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-1">
                      Mantén actualizados los precios y la disponibilidad
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-1">
                      Proporciona descripciones detalladas y precisas
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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