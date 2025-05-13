import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest, validateQuery, validateParams } from "../middleware/validation.middleware";
import { createProductSchema, updateProductSchema, productQuerySchema } from "../schemas/product.schema";
import { z } from "zod";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const productController = new ProductController();

// Ensure uploads directory exists for products
const productUploadsDir = path.join(__dirname, '../../../uploads/products'); 
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
  console.log(`Created product uploads directory: ${productUploadsDir}`);
}

// Configure Multer for product image uploads
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  }
});

/**
 * @swagger
 * /products:
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
 *             $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/",
  authenticate,
  authorize(["SELLER", "ADMIN"]),
  productUpload.array('images', 10),
  validateRequest(createProductSchema),
  (req, res) => productController.createProduct(req, res)
);

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 */
router.get("/:productId", (req, res) => productController.getProductById(req, res));

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: productTypeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/", (req, res) => productController.getProducts(req, res));

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  "/:productId",
  authenticate,
  validateRequest(updateProductSchema),
  (req, res) => productController.updateProduct(req, res)
);

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete("/:productId", authenticate, (req, res) => productController.deleteProduct(req, res));

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: List of featured products
 */
router.get("/featured", (req, res) => productController.getFeaturedProducts(req, res));

// Get a specific product by ID
router.get(
  '/:productId',
  validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID') })),
  (req, res) => productController.getProductById(req, res)
);

// Get products by user ID (seller ID)
router.get(
  '/user/:userId',
  validateParams(z.object({ userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID') })),
  validateQuery(productQuerySchema.pick({ page: true, limit: true, sortBy: true, sortOrder: true })), // Allow pagination/sorting
  (req, res) => productController.getUserProducts(req, res)
);

// Get products by category ID
router.get(
  '/category/:categoryId',
  validateParams(z.object({ categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID') })),
  validateQuery(productQuerySchema.pick({ page: true, limit: true, sortBy: true, sortOrder: true })), // Allow pagination/sorting
  (req, res) => productController.getCategoryProducts(req, res)
);

export default router; 
