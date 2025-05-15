import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Card from '../components/ui/Card'; // No longer needed directly for product items
import { IProduct, ProductFilters } from '../interfaces/product';
import api from '../services/api';
import Header from '../components/layout/Header';
// import UserProfile from '../components/common/UserProfile'; // UserProfile is now within ProductCard if needed
import ProductCard from '../components/products/ProductCard'; // Import ProductCard
import CartIcon from '../components/cart/CartIcon';
import { useCart } from '../context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  stockQuantity?: number; // Add stockQuantity field for backend compatibility
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Construct query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('categoryId', filters.category);
      if (filters.region) queryParams.append('department', filters.region);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

      const response = await api.get(`/products?${queryParams.toString()}`);
      
      if (response.data.success && response.data.data) {
        console.log("API Response:", response.data);
        console.log("Example product:", response.data.data.products?.[0]);
        
        // Normalize the product data to ensure it has the fields we need
        const normalizedProducts = (response.data.data.products || []).map((product: any) => {
          // The backend might use different field names (basePrice/price, stockQuantity/availableQuantity)
          return {
            ...product,
            price: product.price || product.basePrice,
            availableQuantity: product.availableQuantity || product.stockQuantity || 0
          };
        });
        
        console.log("Normalized products:", normalizedProducts[0]);
        
        setProducts(normalizedProducts);
        setTotalProducts(response.data.data.pagination?.total || normalizedProducts.length);
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

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }

    // The backend might be using stockQuantity instead of availableQuantity
    // Let's check both fields and use the one that's available
    const stockAmount = typeof product.stockQuantity === 'number' ? 
      product.stockQuantity : 
      (typeof product.availableQuantity === 'number' ? 
        product.availableQuantity : 0);

    // Check if there is stock available
    if (stockAmount <= 0) {
      toast.error(`${product.name} no está disponible en inventario`);
      return;
    }

    // Get primary image URL if available
    const primaryImage = product.images?.find(img => img.isPrimary);
    const imageUrl = primaryImage?.imageUrl || product.images?.[0]?.imageUrl;

    // Add item to cart and check result
    const success = addItem({
      productId: product.id || '',
      name: product.name,
      price: product.price,
      quantity: 1,
      unitMeasure: product.unitMeasure,
      imageUrl,
      sellerName: product.seller ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() : 'Agricultor verificado',
      stockQuantity: stockAmount // Use the correct stock amount
    });

    if (success) {
      toast.success(`${product.name} agregado al carrito`);
      navigate('/carrito');
    } else {
      toast.error(`No se pudo agregar ${product.name} al carrito. Stock insuficiente.`);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-green-1 text-white py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
          <h1 className="text-2xl font-bold">Bienvenido a tu mercado agrícola</h1>
          <p className="mt-2">Compra y vende directamente con productores</p>
          </div>
          <div className="flex items-center">
            <CartIcon className="text-white" />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onViewDetails={(productId) => navigate(`/product/${productId}`)}
                  onAddToCart={handleAddToCart}
                  viewContext="marketplace"
                />
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
      
      {/* Toast notifications */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default Marketplace; 