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

