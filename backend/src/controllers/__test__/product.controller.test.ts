import { Request, Response } from 'express';
import { ProductController } from '../product.controller';
import { ProductService } from '../../services/product.service';
import HttpStatusCode from '../../utils/HttpStatusCode';
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from '../../utils/responseHandler';

// Mock dependencies
jest.mock('../../services/product.service');
jest.mock('../../utils/responseHandler');

describe('ProductController', () => {
  let productController: ProductController;
  let mockProductService: jest.Mocked<ProductService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock service
    mockProductService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      hardDelete: jest.fn(),
      belongsToFarmer: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;
    
    // Mock the ProductService constructor
    jest.spyOn(ProductService.prototype, 'create').mockImplementation(mockProductService.create);
    jest.spyOn(ProductService.prototype, 'findById').mockImplementation(mockProductService.findById);
    jest.spyOn(ProductService.prototype, 'findAll').mockImplementation(mockProductService.findAll);
    jest.spyOn(ProductService.prototype, 'update').mockImplementation(mockProductService.update);
    jest.spyOn(ProductService.prototype, 'delete').mockImplementation(mockProductService.delete);
    jest.spyOn(ProductService.prototype, 'hardDelete').mockImplementation(mockProductService.hardDelete);
    jest.spyOn(ProductService.prototype, 'belongsToFarmer').mockImplementation(mockProductService.belongsToFarmer);
    
    // Create controller
    productController = new ProductController();

    // Setup request and response mocks
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: 'farmer123',
        username: 'farmer',
        role: 'farmer'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock response handlers
    (sendSuccessResponse as jest.Mock).mockImplementation(() => {});
    (sendErrorResponse as jest.Mock).mockImplementation(() => {});
    (sendNotFoundResponse as jest.Mock).mockImplementation(() => {});
  });

  describe('updateProduct', () => {
    it('should return bad request when farmer ID is missing', async () => {
      // Arrange
      const productId = 'product123';
      mockRequest.params = { product_id: productId };
      // Fix: Provide all required properties for user object
      mockRequest.user = { 
        userId: '', // Using an empty string instead of undefined
        username: 'farmer',
        role: 'farmer' 
      };
      
      const updateData = {
        name: 'Updated Organic Apples',
        price: 3.49
      };
      mockRequest.body = updateData;
      
      const mockProduct = {
        id: productId,
        name: 'Organic Apples',
        price: 2.99,
        description: 'Fresh organic apples',
        quantity: 100,
        photos: ['https://example.com/apple.jpg'],
        category: 'Fruits',
        availability_start_date: new Date('2023-01-01T00:00:00Z'),
        availability_end_date: new Date('2023-12-31T23:59:59Z'),
        farmer_id: 'farmer123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProductService.findById.mockResolvedValue(mockProduct);

      // Act
      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProductService.findById).toHaveBeenCalledWith(productId);
      expect(mockProductService.belongsToFarmer).not.toHaveBeenCalled();
      expect(mockProductService.update).not.toHaveBeenCalled();
      expect(sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        "Farmer ID is required",
        HttpStatusCode.BAD_REQUEST,
        "BAD_REQUEST"
      );
    });
  });

  describe('deleteProduct', () => {
    it('should return bad request when farmer ID is missing', async () => {
      // Arrange
      const productId = 'product123';
      mockRequest.params = { product_id: productId };
      // Fix: Provide all required properties for user object
      mockRequest.user = { 
        userId: "", // Using undefined instead of omitting the property
        username: 'farmer',
        role: 'farmer' 
      };
      
      const mockProduct = {
        id: productId,
        name: 'Organic Apples',
        price: 2.99,
        description: 'Fresh organic apples',
        quantity: 100,
        photos: ['https://example.com/apple.jpg'],
        category: 'Fruits',
        availability_start_date: new Date('2023-01-01T00:00:00Z'),
        availability_end_date: new Date('2023-12-31T23:59:59Z'),
        farmer_id: 'farmer123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockProductService.findById.mockResolvedValue(mockProduct);

      // Act
      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockProductService.findById).toHaveBeenCalledWith(productId);
      expect(mockProductService.belongsToFarmer).not.toHaveBeenCalled();
      expect(mockProductService.delete).not.toHaveBeenCalled();
      expect(sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        "Farmer ID is required",
        HttpStatusCode.BAD_REQUEST,
        "BAD_REQUEST"
      );
    });
  });

  
});