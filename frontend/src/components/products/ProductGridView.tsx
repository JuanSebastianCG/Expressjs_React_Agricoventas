import React from 'react';
import { IProduct } from '../../interfaces/product';
import Card from '../ui/Card';

interface ProductGridViewProps {
  products: IProduct[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

const ProductGridView: React.FC<ProductGridViewProps> = ({ 
  products, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <Card key={product.id} className="relative flex flex-col h-full">
          {/* Active Badge */}
          {product.isActive && (
            <div className="absolute top-2 right-2 bg-green-0-5 text-green-1 text-xs font-semibold px-2 py-1 rounded">
              Activo
            </div>
          )}

          {/* Product Image */}
          <div className="w-full h-48 mb-4">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-t-md"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-md">
                <span className="text-gray-500">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 flex-grow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
            <p className="text-green-1 font-bold text-xl mb-2">
              ${product.price?.toLocaleString('es-CO')} COP/{product.unitMeasure}
            </p>
            <div className="text-sm text-gray-1 mb-1">
              <span className="font-semibold">Región:</span> {product.region}
            </div>
            <div className="text-sm text-gray-1 mb-4">
              <span className="font-semibold">Stock:</span> {product.availableQuantity} {product.unitMeasure}
            </div>

            {/* Certification badges if any */}
            {product.certifications && product.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {product.certifications.map((cert, index) => (
                  <span key={index} className="bg-green-0-5 text-green-1 text-xs px-2 py-1 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto p-4 pt-0">
            <div className="flex space-x-2">
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
                Ver
              </button>
              <button
                onClick={() => onDelete(product.id || '')}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProductGridView; 