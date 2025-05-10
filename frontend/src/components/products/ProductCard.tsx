import React from 'react';
import Card from '../ui/Card';
import { IProduct } from '../../interfaces/product';

interface ProductCardProps {
  product: IProduct;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onViewDetails }) => {
  return (
    <Card className="relative">
      {/* Active Badge */}
      {product.isActive && (
        <div className="absolute top-2 right-2 bg-green-0-5 text-green-1 text-xs font-semibold px-2 py-1 rounded">
          Activo
        </div>
      )}

      <div className="flex space-x-4">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
              <span className="text-gray-500 text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
          <p className="text-sm mb-1">
            <span className="font-semibold">Precio:</span> {product.price?.toLocaleString('es-CO')} COP/{product.unitMeasure}
          </p>
          <p className="text-sm mb-1">
            <span className="font-semibold">Región:</span> {product.region}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Stock:</span> {product.availableQuantity} {product.unitMeasure}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex mt-4 space-x-2">
        <button
          onClick={() => onEdit(product.id || '')}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded transition-colors text-sm"
        >
          Editar
        </button>
        <button
          onClick={() => onViewDetails(product.id || '')}
          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-4 rounded transition-colors text-sm"
        >
          Ver Detalles
        </button>
        <button
          onClick={() => onDelete(product.id || '')}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded transition-colors text-sm"
        >
          Eliminar
        </button>
      </div>
    </Card>
  );
};

export default ProductCard; 