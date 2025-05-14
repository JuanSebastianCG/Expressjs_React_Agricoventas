import React, { useState } from 'react';
import Card from '../ui/Card';
import { IProduct } from '../../interfaces/product';

interface ProductCardProps {
  product: IProduct;
  onViewDetails: (productId: string) => void;
  // Props for MyProducts view
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  // Prop for Marketplace view
  onAddToCart?: (productId: string) => void;
  // To determine which set of buttons to show
  viewContext?: 'marketplace' | 'my-products'; 
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onAddToCart,
  viewContext = 'marketplace' // Default to marketplace view
}) => {
  const sellerName = product.seller ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() : 'N/A';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images || [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Product Image with Carousel */}
      <div 
        className="w-full h-48 bg-gray-200 cursor-pointer overflow-hidden relative" // Added relative for button positioning
        onClick={() => onViewDetails(product.id || '')}
      >
        {images.length > 0 ? (
          <img 
            src={images[currentImageIndex]?.imageUrl} 
            alt={`${product.name} - image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500">Sin imagen</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 transition-opacity focus:outline-none"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 transition-opacity focus:outline-none"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 bg-opacity-50'} hover:bg-opacity-75 focus:outline-none`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 
          className="text-lg font-semibold text-gray-800 mb-1 cursor-pointer truncate" 
          title={product.name}
          onClick={() => onViewDetails(product.id || '')}
        >
          {product.name}
        </h3>
        <p className="text-2xl font-bold text-green-1 mb-2">
          {typeof product.price === 'number' 
            ? product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }) 
            : 'Precio no disponible'}
          {product.unitMeasure && typeof product.price === 'number' ? `/${product.unitMeasure}` : ''}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Región: <span className="font-medium text-gray-700">{product.region || 'N/A'}</span>
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Vendedor: <span className="font-medium text-gray-700">{sellerName}</span>
        </p>
        
        {/* Spacer to push buttons to the bottom if content is short */}
        <div className="flex-grow"></div>

        {/* Action Buttons based on context */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          {viewContext === 'marketplace' && (
            <div className="flex space-x-2">
              <button
                onClick={() => onViewDetails(product.id || '')}
                className="flex-1 bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-0-8 focus:ring-opacity-50"
              >
                Ver Detalles
              </button>
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(product.id || '')}
                  className="flex-1 bg-yellow-1 hover:bg-yellow-1-5 text-gray-800 py-2 px-4 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-2 focus:ring-opacity-50"
                >
                  Agregar al Carrito
                </button>
              )}
            </div>
          )}
          {viewContext === 'my-products' && onEdit && onDelete && (
            <div className="flex space-x-2">
              <button
                onClick={() => onViewDetails(product.id || '')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Detalles
              </button>
              <button
                onClick={() => onEdit(product.id || '')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(product.id || '')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
      {product.isActive === false && viewContext === 'my-products' && (
        <div className="absolute top-2 right-2 bg-red-1 text-white text-xs font-semibold px-2 py-1 rounded-md shadow">
          Inactivo
        </div>
      )}
       {product.isFeatured && (
        <div className="absolute top-2 left-2 bg-yellow-1-5 text-gray-800 text-xs font-bold px-2 py-1 rounded-md shadow-lg transform -rotate-3">
          DESTACADO
        </div>
      )}
    </Card>
  );
};

export default ProductCard; 