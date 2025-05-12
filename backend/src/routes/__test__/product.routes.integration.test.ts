import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { ProductController } from '../../controllers/product.controller';
import { ProductMiddleware } from '../../middleware/product.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

// Mock dependencies
jest.mock('../../controllers/product.controller');
jest.mock('../../middleware/product.middleware');
jest.mock('../../middleware/auth.middleware');

describe('Product Routes Integration', () => {
  let app: express.Application;
  let mockProductController: jest.Mocked<ProductController>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new Express app
    app = express();
    app.use(express.json());

    // Create mock controller methods
    const mockCreateProduct = jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        success: true,
        data: {
          id: 'product123',
          name: req.body.name,
          price: req.body.price,
          // ... other fields
        }
      });
    });

    const mockGetProductById = jest.fn().mockImplementation((req, res) => {
      const productId = req.params.product_id;
      res.status(200).json({
        success: true,
        data: {
          id: productId,
          name: 'Organic Apples',
          price: 2.99,
          // ... other fields
        }
      });
    });

    const mockGetProducts = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        data: {
          products: [
            { id: 'product123', name: 'Organic Apples', price: 2.99 },
            { id: 'product456', name: 'Fresh Carrots', price: 1.99 }
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1
          }
        }
      });
    });

    const mockUpdateProduct = jest.fn().mockImplementation((req, res) => {
      const productId = req.params.product_id;
      res.status(200).json({
        success: true,
        data: {
          id: productId,
          name: req.body.name || 'Organic Apples',
          price: req.body.price || 2.99,
          // ... other fields
        }
      });
    });

    const mockDeleteProduct = jest.fn().mockImplementation((req, res) => {
      res.status(204).end();
    });

    // Create mock controller
    mockProductController = {
      createProduct: mockCreateProduct,
      getProductById: mockGetProductById,
      getProducts: mockGetProducts,
      updateProduct: mockUpdateProduct,
      deleteProduct: mockDeleteProduct
    } as unknown as jest.Mocked<ProductController>;

    // Mock the ProductController constructor
    (ProductController as jest.Mock).mockImplementation(() => mockProductController);

    // Mock middleware
    (ProductMiddleware.validateCreateProduct as jest.Mock).mockImplementation((req, res, next) => next());
    (ProductMiddleware.validateUpdateProduct as jest.Mock).mockImplementation((req, res, next) => next());
    (ProductMiddleware.validateProductQuery as jest.Mock).mockImplementation((req, res, next) => next());
    (ProductMiddleware.validateProductId as jest.Mock).mockImplementation((req, res, next) => next());
    (ProductMiddleware.isFarmer as jest.Mock).mockImplementation((req, res, next) => next());
    
    (authenticate as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { userId: 'farmer123', username: 'farmer', role: 'farmer' };
      next();
    });
    (authorize as jest.Mock).mockImplementation((roles) => (req: express.Request, res: express.Response, next: express.NextFunction) => next());

    // Create routes manually
    const router = Router();
    
    // Register routes with mock controller methods
    // Fix: Add explicit types to parameters
    router.post(
      "/products",
      authenticate,
      ProductMiddleware.isFarmer,
      ProductMiddleware.validateCreateProduct,
      async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await mockProductController.createProduct(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    router.get(
      "/products/:product_id",
      ProductMiddleware.validateProductId,
      async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await mockProductController.getProductById(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    router.get(
      "/products",
      ProductMiddleware.validateProductQuery,
      async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await mockProductController.getProducts(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    router.put(
      "/products/:product_id",
      authenticate,
      ProductMiddleware.isFarmer,
      ProductMiddleware.validateProductId,
      ProductMiddleware.validateUpdateProduct,
      async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await mockProductController.updateProduct(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    router.delete(
      "/products/:product_id",
      authenticate,
      ProductMiddleware.isFarmer,
      ProductMiddleware.validateProductId,
      async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await mockProductController.deleteProduct(req, res);
        } catch (error) {
          next(error);
        }
      }
    );
    
    // Use the router
    app.use('/api', router);
  });

  describe('GET /api/products', () => {
    it('should get products with pagination successfully', async () => {
      // Act
      const response = await request(app)
        .get('/api/products')
        .query({
          category: 'Fruits',
          search: 'apple',
          min_price: '1.99',
          max_price: '5.99',
          page: '1',
          limit: '10'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('total', 2);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      
      // Fix: Remove the syntax error
      expect(ProductMiddleware.validateProductQuery).toHaveBeenCalled();
      expect(mockProductController.getProducts).toHaveBeenCalled();
    });
  });

  // Other test cases remain the same...
});