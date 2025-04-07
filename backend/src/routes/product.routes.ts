import { Router } from "express"
import { ProductController } from "../controllers/product.controller"
import { ProductMiddleware } from "../middleware/product.middleware"
import { authenticate,authorize } from "../middleware/auth.middleware"

const router = Router()
const productController = new ProductController()

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - quantity
 *         - category
 *         - availability_start_date
 *         - availability_end_date
 *         - farmer_id
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the product
 *         quantity:
 *           type: integer
 *           description: Available quantity of the product
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of product images
 *         category:
 *           type: string
 *           description: Product category (e.g., 'Vegetables', 'Fruits')
 *         availability_start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of product availability
 *         availability_end_date:
 *           type: string
 *           format: date-time
 *           description: End date of product availability
 *         farmer_id:
 *           type: string
 *           description: ID of the farmer who created the product
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active or not
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was last updated
 *       example:
 *         id: "60d21b4667d0d8992e610c85"
 *         name: "Organic Tomatoes"
 *         description: "Fresh organic tomatoes from our farm"
 *         price: 2.99
 *         quantity: 100
 *         photos: ["https://example.com/tomato1.jpg", "https://example.com/tomato2.jpg"]
 *         category: "Vegetables"
 *         availability_start_date: "2023-06-01T00:00:00Z"
 *         availability_end_date: "2023-06-30T00:00:00Z"
 *         farmer_id: "60d21b4667d0d8992e610c84"
 *         isActive: true
 *         createdAt: "2023-05-15T10:30:00Z"
 *         updatedAt: "2023-05-15T10:30:00Z"
 *
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - quantity
 *         - category
 *         - availability_start_date
 *         - availability_end_date
 *         - farmer_id
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the product
 *         quantity:
 *           type: integer
 *           description: Available quantity of the product
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of product images
 *         category:
 *           type: string
 *           description: Product category (e.g., 'Vegetables', 'Fruits')
 *         availability_start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of product availability
 *         availability_end_date:
 *           type: string
 *           format: date-time
 *           description: End date of product availability
 *         farmer_id:
 *           type: string
 *           description: ID of the farmer who created the product
 *       example:
 *         name: "Organic Tomatoes"
 *         description: "Fresh organic tomatoes from our farm"
 *         price: 2.99
 *         quantity: 100
 *         photos: ["https://example.com/tomato1.jpg", "https://example.com/tomato2.jpg"]
 *         category: "Vegetables"
 *         availability_start_date: "2023-06-01T00:00:00Z"
 *         availability_end_date: "2023-06-30T00:00:00Z"
 *         farmer_id: "60d21b4667d0d8992e610c84"
 *
 *     ProductUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: Detailed description of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the product
 *         quantity:
 *           type: integer
 *           description: Available quantity of the product
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of product images
 *         category:
 *           type: string
 *           description: Product category (e.g., 'Vegetables', 'Fruits')
 *         availability_start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of product availability
 *         availability_end_date:
 *           type: string
 *           format: date-time
 *           description: End date of product availability
 *       example:
 *         name: "Premium Organic Tomatoes"
 *         price: 3.49
 *         quantity: 75
 *
 *     PaginatedProductsResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of products
 *             page:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Number of items per page
 *             pages:
 *               type: integer
 *               description: Total number of pages
 *       example:
 *         products: [
 *           {
 *             id: "60d21b4667d0d8992e610c85",
 *             name: "Organic Tomatoes",
 *             description: "Fresh organic tomatoes from our farm",
 *             price: 2.99,
 *             quantity: 100,
 *             photos: ["https://example.com/tomato1.jpg", "https://example.com/tomato2.jpg"],
 *             category: "Vegetables",
 *             availability_start_date: "2023-06-01T00:00:00Z",
 *             availability_end_date: "2023-06-30T00:00:00Z",
 *             farmer_id: "60d21b4667d0d8992e610c84",
 *             isActive: true,
 *             createdAt: "2023-05-15T10:30:00Z",
 *             updatedAt: "2023-05-15T10:30:00Z"
 *           }
 *         ],
 *         pagination: {
 *           total: 50,
 *           page: 1,
 *           limit: 10,
 *           pages: 5
 *         }
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             code:
 *               type: string
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *       example:
 *         success: false
 *         error:
 *           message: "Invalid product data"
 *           code: "VALIDATION_ERROR"
 *           details: [
 *             {
 *               field: "price",
 *               message: "Price must be a positive number"
 *             }
 *           ]
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a farmer or not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/products",
  authenticate,
  ProductMiddleware.isFarmer,
  ProductMiddleware.validateCreateProduct,
  async (req, res, next) => {
    try {
      await productController.createProduct(req, res)
    } catch (error) {
      next(error)
    }
  }
)

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/products/:product_id",
  ProductMiddleware.validateProductId,
  async (req, res, next) => {
    try {
      await productController.getProductById(req, res)
    } catch (error) {
      next(error)
    }
  }
)

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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or description
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Filter by minimum price
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Filter by maximum price
 *       - in: query
 *         name: availability_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by availability date (ISO format)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedProductsResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/products", 
    ProductMiddleware.validateProductQuery,
    async (req, res, next) => {
        try {
            await productController.getProducts(req, res)
        } catch (error) {
            next(error)
        }
    }

)

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a farmer or not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/products/:product_id",
  authenticate,
  ProductMiddleware.isFarmer,
  ProductMiddleware.validateProductId,
  ProductMiddleware.validateUpdateProduct,
  async (req, res, next) => {
    try {
      await productController.updateProduct(req, res)
    } catch (error) {
      next(error)
    }
  }

)

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
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User is not a farmer or not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
    "/products/:product_id",
    authenticate,
    ProductMiddleware.isFarmer,
    ProductMiddleware.validateProductId,
    async (req, res, next) => {
        try {
            await productController.deleteProduct(req, res);
        } catch (error) {
            next(error);
        }
    }
);

export default router

