/**
 * Product model interface
 */
export interface IProduct {
  id?: string;
  name: string;
  description: string;
  category: string;
  region: string;
  quality: string;
  price: number;
  availableQuantity: number;
  unitMeasure: string;
  certifications: string[];
  images: string[];
  isFeatured?: boolean;
  sellerId?: string;
  sellerName?: string;
}

/**
 * Product service interface
 */
export interface IProductService {
  getProducts(filters?: ProductFilters): Promise<IProduct[]>;
  getProductById(id: string): Promise<IProduct>;
  createProduct(product: Omit<IProduct, 'id'>): Promise<IProduct>;
  updateProduct(id: string, product: Partial<IProduct>): Promise<IProduct>;
  deleteProduct(id: string): Promise<boolean>;
  uploadProductImages(files: File[]): Promise<string[]>;
}

/**
 * Product filters interface
 */
export interface ProductFilters {
  category?: string;
  region?: string;
  quality?: string;
  sortBy?: string;
} 