import { Router } from "express"
import { PriceHistoryController } from "../controllers/priceHistory.controller"
import { PriceHistoryMiddleware } from "../middleware/priceHistory.middleware"
import { authenticate } from "../middleware/auth.middleware"

const router = Router()
const priceHistoryController = new PriceHistoryController()

/**
 * @swagger
 * tags:
 *   name: Price History
 *   description: Price history tracking and analysis endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceHistory:
 *       type: object
 *       required:
 *         - product_id
 *         - price
 *         - market_name
 *         - location
 *         - unit
 *         - recorded_by
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the price history entry
 *         product_id:
 *           type: string
 *           description: ID of the product
 *         product_name:
 *           type: string
 *           description: Name of the product
 *         product_category:
 *           type: string
 *           description: Category of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The recorded price
 *         market_name:
 *           type: string
 *           description: Name of the market where price was recorded
 *         location:
 *           type: string
 *           description: Location of the market
 *         quality_grade:
 *           type: string
 *           enum: [Premium, Standard, Second, Processing]
 *           description: Quality grade of the product
 *         unit:
 *           type: string
 *           description: Unit of measurement (kg, lb, bunch, etc.)
 *         quantity_available:
 *           type: integer
 *           description: Quantity available at the time of recording
 *         notes:
 *           type: string
 *           description: Additional notes about the price recording
 *         source:
 *           type: string
 *           description: Source of the price information
 *         recorded_by:
 *           type: string
 *           description: ID of the user who recorded the price
 *         recorded_at:
 *           type: string
 *           format: date-time
 *           description: When the price was recorded
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the entry was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the entry was last updated
 *       example:
 *         id: "60d21b4667d0d8992e610c85"
 *         product_id: "60d21b4667d0d8992e610c84"
 *         product_name: "Organic Tomatoes"
 *         product_category: "Vegetables"
 *         price: 2.99
 *         market_name: "Central Market"
 *         location: "Bogotá, Colombia"
 *         quality_grade: "Premium"
 *         unit: "kg"
 *         quantity_available: 100
 *         notes: "Fresh harvest, excellent quality"
 *         source: "Manual Entry"
 *         recorded_by: "60d21b4667d0d8992e610c83"
 *         recorded_at: "2023-06-15T10:30:00Z"
 *         createdAt: "2023-06-15T10:30:00Z"
 *         updatedAt: "2023-06-15T10:30:00Z"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/price-history:
 *   post:
 *     summary: Create a new price history entry
 *     tags: [Price History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - price
 *               - market_name
 *               - location
 *               - unit
 *             properties:
 *               product_id:
 *                 type: string
 *               price:
 *                 type: number
 *               market_name:
 *                 type: string
 *               location:
 *                 type: string
 *               quality_grade:
 *                 type: string
 *                 enum: [Premium, Standard, Second, Processing]
 *               unit:
 *                 type: string
 *               quantity_available:
 *                 type: integer
 *               notes:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Price history entry created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, PriceHistoryMiddleware.validateCreatePriceHistory, async (req, res) => {
  await priceHistoryController.createPriceHistory(req, res)
})

/**
 * @swagger
 * /api/price-history/{history_id}:
 *   get:
 *     summary: Get a price history entry by ID
 *     tags: [Price History]
 *     parameters:
 *       - in: path
 *         name: history_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the price history entry
 *     responses:
 *       200:
 *         description: Price history entry retrieved successfully
 *       404:
 *         description: Price history entry not found
 *       500:
 *         description: Server error
 */
router.get("/:history_id", PriceHistoryMiddleware.validatePriceHistoryId, async (req, res) => {
  await priceHistoryController.getPriceHistoryById(req, res)
})

/**
 * @swagger
 * /api/price-history:
 *   get:
 *     summary: Get price history entries with filtering and pagination
 *     tags: [Price History]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: product_name
 *         schema:
 *           type: string
 *         description: Filter by product name (partial match)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: market_name
 *         schema:
 *           type: string
 *         description: Filter by market name
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: quality_grade
 *         schema:
 *           type: string
 *           enum: [Premium, Standard, Second, Processing]
 *         description: Filter by quality grade
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO format)
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
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source
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
 *           default: 20
 *         description: Number of entries per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [date, price, product_name, market_name]
 *           default: date
 *         description: Sort by field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Price history entries retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/", PriceHistoryMiddleware.validatePriceHistoryQuery, async (req, res) => {
  await priceHistoryController.getPriceHistory(req, res)
})

/**
 * @swagger
 * /api/price-history/{history_id}:
 *   put:
 *     summary: Update a price history entry
 *     tags: [Price History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: history_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the price history entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               price:
 *                 type: number
 *               market_name:
 *                 type: string
 *               location:
 *                 type: string
 *               quality_grade:
 *                 type: string
 *                 enum: [Premium, Standard, Second, Processing]
 *               unit:
 *                 type: string
 *               quantity_available:
 *                 type: integer
 *               notes:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: Price history entry updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Price history entry not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:history_id",
  authenticate,
  PriceHistoryMiddleware.validatePriceHistoryId,
  PriceHistoryMiddleware.validateUpdatePriceHistory,
  async (req, res) => {
    await priceHistoryController.updatePriceHistory(req, res)
  },
)

/**
 * @swagger
 * /api/price-history/{history_id}:
 *   delete:
 *     summary: Delete a price history entry
 *     tags: [Price History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: history_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the price history entry
 *     responses:
 *       204:
 *         description: Price history entry deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Price history entry not found
 *       500:
 *         description: Server error
 */
router.delete("/:history_id", authenticate, PriceHistoryMiddleware.validatePriceHistoryId, async (req, res) => {
  await priceHistoryController.deletePriceHistory(req, res)
})

/**
 * @swagger
 * /api/price-history/statistics:
 *   get:
 *     summary: Get price statistics and analysis
 *     tags: [Price History]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: product_name
 *         schema:
 *           type: string
 *         description: Filter by product name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: market_name
 *         schema:
 *           type: string
 *         description: Filter by market name
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Time period for analysis
 *       - in: query
 *         name: include_trends
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include price trends in response
 *       - in: query
 *         name: include_forecasts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include price forecasts in response
 *     responses:
 *       200:
 *         description: Price statistics retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/statistics", PriceHistoryMiddleware.validatePriceStatisticsQuery, async (req, res) => {
  await priceHistoryController.getPriceStatistics(req, res)
})

export default router
