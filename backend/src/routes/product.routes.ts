import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { ProductMiddleware } from "../middleware/product.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { cache } from "../middleware/cache.middleware";

const router = Router();
const productController = new ProductController();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/products",
  authenticate,
  ProductMiddleware.isFarmer,
  ProductMiddleware.validateCreateProduct,
  (req, res, next) => {
    productController.createProduct(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/products/{product_id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product to retrieve
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 */
router.get(
  "/products/:product_id",
  ProductMiddleware.validateProductId,
  cache(60), // Cache for 60 seconds
  (req, res, next) => {
    productController.getProductById(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get(
  "/products", 
  ProductMiddleware.validateProductQuery,
  cache(30), // Cache for 30 seconds
  (req, res, next) => {
    productController.getProducts(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/farmers/{farmer_id}/products:
 *   get:
 *     summary: Get products by farmer ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: farmer_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the farmer
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get(
  "/farmers/:farmer_id/products",
  cache(60), // Cache for 60 seconds
  (req, res, next) => {
    productController.getFarmerProducts(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/products/{product_id}/inventory:
 *   get:
 *     summary: Get product inventory status
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: Inventory status retrieved successfully
 */
router.get(
  "/products/:product_id/inventory",
  ProductMiddleware.validateProductId,
  cache(30), // Cache for 30 seconds
  (req, res, next) => {
    productController.getProductInventory(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/products/{product_id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product to update
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  "/products/:product_id",
  authenticate,
  ProductMiddleware.isFarmer,
  ProductMiddleware.validateProductId,
  ProductMiddleware.validateUpdateProduct,
  (req, res, next) => {
    productController.updateProduct(req, res, next)
      .catch(next);
  }
);

/**
 * @swagger
 * /api/products/{product_id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product to delete
 *     responses:
 *       204:
 *         description: Product deleted successfully
 */
router.delete(
  "/products/:product_id",
  authenticate,
  ProductMiddleware.isFarmer,
  ProductMiddleware.validateProductId,
  (req, res, next) => {
    productController.deleteProduct(req, res, next)
      .catch(next);
  }
);

export default router;