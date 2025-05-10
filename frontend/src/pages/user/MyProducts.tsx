import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Header from '../../components/layout/Header';
import { useAppContext } from '../../context/AppContext';
import { IProduct } from '../../interfaces/product';
import api from '../../services/api';
import UserProfile from '../../components/common/UserProfile';

const MyProducts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  
  // Products state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  
  // Product deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch user's products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/products', {
        params: { sellerId: user?.id }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalProductsCount(response.data.total || response.data.data.length);
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

  // Load products on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProducts();
    }
  }, [isAuthenticated, user]);

  // Handle product creation
  const handleCreateProduct = () => {
    navigate('/crear-producto');
  };

  // Handle product editing
  const handleEditProduct = (productId: string) => {
    navigate(`/editar-producto/${productId}`);
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
        {/* User Profile Section */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2">
            <div className="mb-4 md:mb-0">
              <UserProfile user={user} variant="detailed" showActions={false} />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <div className="mr-6 mb-4 sm:mb-0">
                <p className="text-sm text-gray-1">Total de productos</p>
                <p className="text-2xl font-bold text-green-1">{totalProductsCount}</p>
              </div>
              <button
                onClick={handleCreateProduct}
                className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
              >
                Agregar Producto
              </button>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-1 text-lg mb-4">No tienes productos registrados.</p>
            <button
              onClick={handleCreateProduct}
              className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
            >
              Crear tu primer producto
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product.id} className="relative">
                {/* Featured badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 bg-yellow-1 text-white text-xs font-semibold px-2 py-1 rounded">
                    Destacado
                  </div>
                )}

                {/* Product image */}
                <div className="aspect-w-16 aspect-h-9 mb-4">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-green-1 font-bold text-xl mb-2">
                  ${product.price.toLocaleString('es-CO')} COP/{product.unitMeasure}
                </p>
                <div className="mb-2">
                  <span className="text-sm text-gray-1">Categoría: {product.category}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-1">Región: {product.region}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-1">Disponible: {product.availableQuantity} {product.unitMeasure}</span>
                </div>

                {/* Certifications */}
                {product.certifications && product.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.certifications.map((cert, index) => (
                      <span key={index} className="bg-green-0-5 text-green-1 text-xs px-2 py-1 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEditProduct(product.id || '')}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => openDeleteModal(product.id || '')}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
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