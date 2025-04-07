import { Router } from "express"
import { OrderController } from "../controllers/order.controller"
import { OrderMiddleware } from "../middleware/order.middleware"
import { AuthMiddleware } from "../middleware/auth.middleware"

const router = Router()
const orderController = new OrderController()

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID (optional, defaults to authenticated user)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   line1:
 *                     type: string
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   line1:
 *                     type: string
 *                   line2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   email:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CREDIT_CARD, BANK_TRANSFER, PAYPAL, CASH_ON_DELIVERY, MOBILE_PAYMENT, OTHER]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/orders",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateCreateOrder,
  orderController.createOrder.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get(
  "/orders/:order_id",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderId,
  orderController.getOrderById.bind(orderController),
)

/**
 * @swagger
 * /api/orders/number/{order_number}:
 *   get:
 *     summary: Get an order by order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Order number to retrieve
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get(
  "/orders/number/:order_number",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderNumber,
  orderController.getOrderByNumber.bind(orderController),
)

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders with filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELED, REFUNDED, ON_HOLD]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: fulfillmentStatus
 *         schema:
 *           type: string
 *           enum: [UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED, RETURNED, PARTIALLY_RETURNED]
 *         description: Filter by fulfillment status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Filter by minimum amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Filter by maximum amount
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalAmount, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/orders",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderQuery,
  orderController.getOrders.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED, CANCELED, REFUNDED, ON_HOLD]
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED]
 *               fulfillmentStatus:
 *                 type: string
 *                 enum: [UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED, RETURNED, PARTIALLY_RETURNED]
 *               trackingNumber:
 *                 type: string
 *               shippingProvider:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put(
  "/orders/:order_id",
  AuthMiddleware.authenticate,
  OrderMiddleware.isAdmin,
  OrderMiddleware.validateOrderId,
  OrderMiddleware.validateUpdateOrder,
  orderController.updateOrder.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}/payment:
 *   post:
 *     summary: Process payment for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to process payment for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED]
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post(
  "/orders/:order_id/payment",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderId,
  OrderMiddleware.validatePaymentUpdate,
  orderController.processPayment.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}/shipment:
 *   post:
 *     summary: Update shipment information for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to update shipment for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               shippingProvider:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *               fulfillmentStatus:
 *                 type: string
 *                 enum: [UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED, RETURNED, PARTIALLY_RETURNED]
 *     responses:
 *       200:
 *         description: Shipment updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post(
  "/orders/:order_id/shipment",
  AuthMiddleware.authenticate,
  OrderMiddleware.isAdmin,
  OrderMiddleware.validateOrderId,
  OrderMiddleware.validateShipmentUpdate,
  orderController.updateShipment.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancelReason
 *             properties:
 *               cancelReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post(
  "/orders/:order_id/cancel",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderId,
  OrderMiddleware.validateCancelOrder,
  orderController.cancelOrder.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}/refund:
 *   post:
 *     summary: Process refund for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to refund
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refundAmount
 *               - refundReason
 *             properties:
 *               refundAmount:
 *                 type: number
 *               refundReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post(
  "/orders/:order_id/refund",
  AuthMiddleware.authenticate,
  OrderMiddleware.isAdmin,
  OrderMiddleware.validateOrderId,
  OrderMiddleware.validateRefundOrder,
  orderController.processRefund.bind(orderController),
)

/**
 * @swagger
 * /api/orders/{order_id}/delivered:
 *   post:
 *     summary: Mark order as delivered
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to mark as delivered
 *     responses:
 *       200:
 *         description: Order marked as delivered successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post(
  "/orders/:order_id/delivered",
  AuthMiddleware.authenticate,
  OrderMiddleware.isAdmin,
  OrderMiddleware.validateOrderId,
  orderController.markAsDelivered.bind(orderController),
)

/**
 * @swagger
 * /api/orders/analytics:
 *   get:
 *     summary: Get order analytics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/orders/analytics", AuthMiddleware.authenticate, orderController.getOrderAnalytics.bind(orderController))

/**
 * @swagger
 * /api/shipping/methods:
 *   post:
 *     summary: Get available shipping methods
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shipping methods retrieved successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post("/shipping/methods", orderController.getShippingMethods.bind(orderController))

/**
 * @swagger
 * /api/shipping/track/{tracking_number}:
 *   get:
 *     summary: Track a shipment
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: tracking_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Tracking number to track
 *       - in: query
 *         name: carrier
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipping carrier
 *     responses:
 *       200:
 *         description: Tracking information retrieved successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.get("/shipping/track/:tracking_number", orderController.trackShipment.bind(orderController))

/**
 * @swagger
 * /api/orders/{order_id}/invoice:
 *   get:
 *     summary: Get invoice for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the order to get invoice for
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Server error
 */
router.get(
  "/orders/:order_id/invoice",
  AuthMiddleware.authenticate,
  OrderMiddleware.validateOrderId,
  orderController.getInvoice.bind(orderController),
)

export default router

