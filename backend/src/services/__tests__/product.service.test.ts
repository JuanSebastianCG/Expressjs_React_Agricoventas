import { ProductService } from '../../services/product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryParams } from '../../schemas/product.schema';

// Define mock data first
const mockProducts = [
  {
    id: 'product123',
    name: 'Organic Apples',
    description: 'Fresh organic apples',
    price: 2.99,
    quantity: 100,
    category: 'Fruits',
    availability_start_date: new Date('2023-01-01T00:00:00Z'),
    availability_end_date: new Date('2023-12-31T23:59:59Z'),
    farmer_id: 'farmer123',
    photos: ['https://example.com/apple.jpg'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'product456',
    name: 'Fresh Carrots',
    description: 'Locally grown carrots',
    price: 1.99,
    quantity: 50,
    category: 'Vegetables',
    availability_start_date: new Date('2023-01-01T00:00:00Z'),
    availability_end_date: new Date('2023-12-31T23:59:59Z'),
    farmer_id: 'farmer456',
    photos: ['https://example.com/carrot.jpg'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Create mock Prisma client
const mockPrismaClient = {
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  }
};

// Mock the @prisma/client module
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient)
  };
});

describe('ProductService Comprehensive Tests', () => {
  let productService: ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    productService = new ProductService();
  });

  describe('create', () => {
    it('should create a new product with all fields', async () => {
      // Arrange
      const productData: CreateProductDto = {
        name: 'Organic Apples',
        description: 'Fresh organic apples',
        price: 2.99,
        quantity: 100,
        category: 'Fruits',
        availability_start_date: '2023-01-01T00:00:00Z',
        availability_end_date: '2023-12-31T23:59:59Z',
        farmer_id: 'farmer123',
        photos: ['https://example.com/apple.jpg']
      };
      
      const mockCreatedProduct = {
        id: 'product123',
        name: 'Organic Apples',
        description: 'Fresh organic apples',
        price: 2.99,
        quantity: 100,
        category: 'Fruits',
        availability_start_date: new Date('2023-01-01T00:00:00Z'),
        availability_end_date: new Date('2023-12-31T23:59:59Z'),
        farmer_id: 'farmer123',
        photos: ['https://example.com/apple.jpg'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrismaClient.product.create.mockResolvedValue(mockCreatedProduct);

      // Act
      const result = await productService.create(productData);

      // Assert
      expect(mockPrismaClient.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          quantity: productData.quantity,
          photos: productData.photos,
          category: productData.category,
          availability_start_date: new Date(productData.availability_start_date),
          availability_end_date: new Date(productData.availability_end_date),
          farmer_id: productData.farmer_id,
        }
      });
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should create a product with minimum required fields', async () => {
      // Arrange
      const productData: CreateProductDto = {
        name: 'Organic Apples',
        price: 2.99,
        quantity: 100,
        category: 'Fruits',
        availability_start_date: '2023-01-01T00:00:00Z',
        availability_end_date: '2023-12-31T23:59:59Z',
        farmer_id: 'farmer123',
        photos: [] // Empty photos array
      };
      
      const mockCreatedProduct = {
        id: 'product123',
        name: 'Organic Apples',
        description: null,
        price: 2.99,
        quantity: 100,
        category: 'Fruits',
        availability_start_date: new Date('2023-01-01T00:00:00Z'),
        availability_end_date: new Date('2023-12-31T23:59:59Z'),
        farmer_id: 'farmer123',
        photos: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrismaClient.product.create.mockResolvedValue(mockCreatedProduct);

      // Act
      const result = await productService.create(productData);

      // Assert
      expect(mockPrismaClient.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          description: undefined,
          price: productData.price,
          quantity: productData.quantity,
          photos: productData.photos,
          category: productData.category,
          availability_start_date: new Date(productData.availability_start_date),
          availability_end_date: new Date(productData.availability_end_date),
          farmer_id: productData.farmer_id,
        }
      });
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const productData: CreateProductDto = {
        name: 'Organic Apples',
        price: 2.99,
        quantity: 100,
        category: 'Fruits',
        availability_start_date: '2023-01-01T00:00:00Z',
        availability_end_date: '2023-12-31T23:59:59Z',
        farmer_id: 'farmer123',
        photos: []
      };
      
      const dbError = new Error('Database connection error');
      mockPrismaClient.product.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.create(productData)).rejects.toThrow(dbError);
      expect(mockPrismaClient.product.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a product by ID', async () => {
      // Arrange
      const productId = 'product123';
      const mockProduct = mockProducts[0];
      
      mockPrismaClient.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await productService.findById(productId);

      // Assert
      expect(mockPrismaClient.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId }
      });
      expect(result).toEqual(mockProduct);
    });

    it('should return null for non-existent product ID', async () => {
      // Arrange
      const productId = 'nonexistent';
      mockPrismaClient.product.findUnique.mockResolvedValue(null);

      // Act
      const result = await productService.findById(productId);

      // Assert
      expect(mockPrismaClient.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId }
      });
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      // Arrange
      const productId = 'product123';
      const dbError = new Error('Database connection error');
      mockPrismaClient.product.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.findById(productId)).rejects.toThrow(dbError);
      expect(mockPrismaClient.product.findUnique).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return products with default pagination', async () => {
      // Arrange
      const params: ProductQueryParams = {
        page: 1,
        limit: 10
      };
      
      mockPrismaClient.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaClient.product.count.mockResolvedValue(mockProducts.length);

      // Act
      const result = await productService.findAll(params);

      // Assert
      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" }
      });
      expect(mockPrismaClient.product.count).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual({
        products: mockProducts,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    });

    it('should apply multiple filters correctly', async () => {
      // Arrange
      const params: ProductQueryParams = {
        category: 'Fruits',
        search: 'apple',
        min_price: 1.99,
        max_price: 5.99,
        availability_date: '2023-06-15T00:00:00Z',
        page: 2,
        limit: 5
      };
      
      mockPrismaClient.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrismaClient.product.count.mockResolvedValue(6);

      // Act
      const result = await productService.findAll(params);

      // Assert
      expect(mockPrismaClient.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: 'Fruits',
          }),
          skip: 5,
          take: 5,
        })
      );
      
      expect(result).toEqual({
        products: [mockProducts[0]],
        pagination: {
          total: 6,
          page: 2,
          limit: 5,
          pages: 2
        }
      });
    });

    it('should handle empty result set', async () => {
      // Arrange
      const params: ProductQueryParams = {
        category: 'NonExistentCategory',
        page: 1,
        limit: 10
      };
      
      mockPrismaClient.product.findMany.mockResolvedValue([]);
      mockPrismaClient.product.count.mockResolvedValue(0);

      // Act
      const result = await productService.findAll(params);

      // Assert
      expect(result).toEqual({
        products: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      });
    });

    it('should handle database errors during findAll', async () => {
      // Arrange
      const params: ProductQueryParams = {
        page: 1,
        limit: 10
      };
      
      const dbError = new Error('Database connection error');
      mockPrismaClient.product.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.findAll(params)).rejects.toThrow(dbError);
    });
  });

  describe('update', () => {
    it('should update a product with partial data', async () => {
      // Arrange
      const productId = 'product123';
      const updateData: UpdateProductDto = {
        name: 'Updated Organic Apples',
        price: 3.49
      };
      
      const mockUpdatedProduct = {
        ...mockProducts[0],
        name: 'Updated Organic Apples',
        price: 3.49,
        updatedAt: new Date()
      };
      
      mockPrismaClient.product.update.mockResolvedValue(mockUpdatedProduct);

      // Act
      const result = await productService.update(productId, updateData);

      // Assert
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should convert date strings to Date objects when updating', async () => {
      // Arrange
      const productId = 'product123';
      const updateData: UpdateProductDto = {
        availability_start_date: '2023-02-01T00:00:00Z',
        availability_end_date: '2023-11-30T23:59:59Z'
      };
      
      const mockUpdatedProduct = {
        ...mockProducts[0],
        availability_start_date: new Date('2023-02-01T00:00:00Z'),
        availability_end_date: new Date('2023-11-30T23:59:59Z'),
        updatedAt: new Date()
      };
      
      mockPrismaClient.product.update.mockResolvedValue(mockUpdatedProduct);

      // Act
      const result = await productService.update(productId, updateData);

      // Assert
      const expectedUpdateData = {
        availability_start_date: new Date(updateData.availability_start_date!),
        availability_end_date: new Date(updateData.availability_end_date!)
      };
      
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: expectedUpdateData
      });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should handle non-existent product during update', async () => {
      // Arrange
      const productId = 'nonexistent';
      const updateData: UpdateProductDto = {
        name: 'Updated Name'
      };
      
      const notFoundError = new Error('Product not found');
      mockPrismaClient.product.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(productService.update(productId, updateData)).rejects.toThrow(notFoundError);
    });

    it('should handle empty update data', async () => {
      // Arrange
      const productId = 'product123';
      const updateData: UpdateProductDto = {};
      
      const mockUpdatedProduct = { ...mockProducts[0] };
      mockPrismaClient.product.update.mockResolvedValue(mockUpdatedProduct);

      // Act
      const result = await productService.update(productId, updateData);

      // Assert
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {}
      });
      expect(result).toEqual(mockUpdatedProduct);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      // Arrange
      const productId = 'product123';
      const mockDeletedProduct = {
        ...mockProducts[0],
        isActive: false,
        updatedAt: new Date()
      };
      
      mockPrismaClient.product.update.mockResolvedValue(mockDeletedProduct);

      // Act
      const result = await productService.delete(productId);

      // Assert
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { isActive: false }
      });
      expect(result).toEqual(mockDeletedProduct);
      expect(result.isActive).toBe(false);
    });

    it('should handle non-existent product during delete', async () => {
      // Arrange
      const productId = 'nonexistent';
      const notFoundError = new Error('Product not found');
      mockPrismaClient.product.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(productService.delete(productId)).rejects.toThrow(notFoundError);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a product', async () => {
      // Arrange
      const productId = 'product123';
      mockPrismaClient.product.delete.mockResolvedValue(mockProducts[0]);

      // Act
      const result = await productService.hardDelete(productId);

      // Assert
      expect(mockPrismaClient.product.delete).toHaveBeenCalledWith({
        where: { id: productId }
      });
      expect(result).toEqual(mockProducts[0]);
    });

    it('should handle non-existent product during hard delete', async () => {
      // Arrange
      const productId = 'nonexistent';
      const notFoundError = new Error('Product not found');
      mockPrismaClient.product.delete.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(productService.hardDelete(productId)).rejects.toThrow(notFoundError);
    });
  });

  describe('belongsToFarmer', () => {
    it('should return true if product belongs to farmer', async () => {
      // Arrange
      const productId = 'product123';
      const farmerId = 'farmer123';
      
      mockPrismaClient.product.findFirst.mockResolvedValue(mockProducts[0]);

      // Act
      const result = await productService.belongsToFarmer(productId, farmerId);

      // Assert
      expect(mockPrismaClient.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: productId,
          farmer_id: farmerId
        }
      });
      expect(result).toBe(true);
    });

    it('should return false if product does not belong to farmer', async () => {
      // Arrange
      const productId = 'product123';
      const farmerId = 'differentFarmer';
      
      mockPrismaClient.product.findFirst.mockResolvedValue(null);

      // Act
      const result = await productService.belongsToFarmer(productId, farmerId);

      // Assert
      expect(mockPrismaClient.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: productId,
          farmer_id: farmerId
        }
      });
      expect(result).toBe(false);
    });

    it('should handle database errors during ownership check', async () => {
      // Arrange
      const productId = 'product123';
      const farmerId = 'farmer123';
      
      const dbError = new Error('Database connection error');
      mockPrismaClient.product.findFirst.mockRejectedValue(dbError);

      // Act & Assert
      await expect(productService.belongsToFarmer(productId, farmerId)).rejects.toThrow(dbError);
    });
  });
});