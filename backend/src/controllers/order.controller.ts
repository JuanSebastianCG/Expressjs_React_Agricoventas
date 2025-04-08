import type { Request, Response } from "express"
import { OrderService } from "../services/order.service"
import { ShipmentService } from "../services/shipment.service"
import { InvoiceService } from "../services/invoice.service"
import type {
  CreateOrderDto,
  UpdateOrderDto,
  OrderQueryParams,
  CancelOrderDto,
  RefundOrderDto,
  UpdatePaymentDto,
  UpdateShipmentDto,
} from "../schemas/order.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler"

export class OrderController {
  private orderService: OrderService
  private shipmentService: ShipmentService
  private invoiceService: InvoiceService

  constructor() {
    this.orderService = new OrderService()
    this.shipmentService = new ShipmentService()
    this.invoiceService = new InvoiceService()
  }

  /**
   * Create a new order
   * @param req - Express request
   * @param res - Express response
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData: CreateOrderDto = req.body

      // Set customer ID from authenticated user if not provided
      if (!orderData.customerId && req.user) {
        orderData.customerId = req.user.userId
      }

      const order = await this.orderService.create(orderData)

      sendSuccessResponse(res, order, HttpStatusCode.CREATED)
    } catch (error) {
      console.error("Error creating order:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to create order", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Get an order by ID
   * @param req - Express request
   * @param res - Express response
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const order = await this.orderService.findById(orderId)

      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Check if user has permission to view this order
      if (req.user && req.user.role !== "admin" && req.user.userId !== order.customerId) {
        // Check if user is a farmer with items in this order
        const isFarmerWithItems = order.items.some((item: any) => item.farmerId === req.user?.userId)

        if (!isFarmerWithItems) {
          sendErrorResponse(
            res,
            "You don't have permission to view this order",
            HttpStatusCode.FORBIDDEN,
            "FORBIDDEN"
          )
          return
        }
      }

      sendSuccessResponse(res, order)
    } catch (error) {
      console.error("Error retrieving order:", error)
      sendErrorResponse(res, "Failed to retrieve order", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get an order by order number
   * @param req - Express request
   * @param res - Express response
   */
  async getOrderByNumber(req: Request, res: Response): Promise<void> {
    try {
      const orderNumber = req.params.order_number
      const order = await this.orderService.findByOrderNumber(orderNumber)

      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Check if user has permission to view this order
      if (req.user && req.user.role !== "admin" && req.user.userId !== order.customerId) {
        // Check if user is a farmer with items in this order
        const isFarmerWithItems = order.items.some((item: any) => item.farmerId === req.user?.userId)

        if (!isFarmerWithItems) {
          sendErrorResponse(
            res,
            "You don't have permission to view this order",
            HttpStatusCode.FORBIDDEN,
            "FORBIDDEN"
          )
          return
        }
      }

      sendSuccessResponse(res, order)
    } catch (error) {
      console.error("Error retrieving order:", error)
      sendErrorResponse(res, "Failed to retrieve order", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get orders with filtering and pagination
   * @param req - Express request
   * @param res - Express response
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const queryParams: OrderQueryParams = {
        customerId: req.query.customerId as string,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        fulfillmentStatus: req.query.fulfillmentStatus as any,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
      }

      // If user is not admin, restrict to their own orders
      if (req.user && req.user.role !== "admin") {
        if (req.user.role === "buyer") {
          queryParams.customerId = req.user.userId
        } else if (req.user.role === "farmer") {
          // For farmers, use a different method to get their orders
          const result = await this.orderService.getFarmerOrders(req.user.userId, queryParams)
          sendSuccessResponse(res, result)
          return
        }
      }

      const result = await this.orderService.findAll(queryParams)
      sendSuccessResponse(res, result)
    } catch (error) {
      console.error("Error retrieving orders:", error)
      sendErrorResponse(res, "Failed to retrieve orders", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Update an order
   * @param req - Express request
   * @param res - Express response
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const updateData: UpdateOrderDto = req.body

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Update order
      const updatedOrder = await this.orderService.update(orderId, updateData)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error updating order:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to update order", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Process payment for an order
   * @param req - Express request
   * @param res - Express response
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const paymentData: UpdatePaymentDto = req.body

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Process payment
      const updatedOrder = await this.orderService.processPayment(orderId, paymentData)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error processing payment:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to process payment", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Update shipment information for an order
   * @param req - Express request
   * @param res - Express response
   */
  async updateShipment(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const shipmentData: UpdateShipmentDto = req.body

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Update shipment
      const updatedOrder = await this.orderService.updateShipment(orderId, shipmentData)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error updating shipment:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to update shipment", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Cancel an order
   * @param req - Express request
   * @param res - Express response
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const cancelData: CancelOrderDto = req.body

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Check if user has permission to cancel this order
      if (req.user && req.user.role !== "admin" && req.user.userId !== order.customerId) {
        sendErrorResponse(
          res,
          "You don't have permission to cancel this order",
          HttpStatusCode.FORBIDDEN,
          "FORBIDDEN"
        )
        return
      }

      // Cancel order
      const updatedOrder = await this.orderService.cancelOrder(orderId, cancelData)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error canceling order:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to cancel order", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Process refund for an order
   * @param req - Express request
   * @param res - Express response
   */
  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id
      const refundData: RefundOrderDto = req.body

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Process refund
      const updatedOrder = await this.orderService.processRefund(orderId, refundData)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error processing refund:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to process refund", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Mark order as delivered
   * @param req - Express request
   * @param res - Express response
   */
  async markAsDelivered(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Mark as delivered
      const updatedOrder = await this.orderService.markAsDelivered(orderId)
      sendSuccessResponse(res, updatedOrder)
    } catch (error) {
      console.error("Error marking order as delivered:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to mark order as delivered", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Get order analytics
   * @param req - Express request
   * @param res - Express response
   */
  async getOrderAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.query.customerId as string
      const fromDate = req.query.fromDate as string
      const toDate = req.query.toDate as string

      // If user is not admin, restrict to their own analytics
      if (req.user && req.user.role !== "admin" && req.user.role === "buyer") {
        const analytics = await this.orderService.getOrderAnalytics(req.user.userId, fromDate, toDate)
        sendSuccessResponse(res, analytics)
        return
      }

      const analytics = await this.orderService.getOrderAnalytics(customerId, fromDate, toDate)
      sendSuccessResponse(res, analytics)
    } catch (error) {
      console.error("Error retrieving order analytics:", error)
      sendErrorResponse(res, "Failed to retrieve order analytics", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get shipping methods
   * @param req - Express request
   * @param res - Express response
   */
  async getShippingMethods(req: Request, res: Response): Promise<void> {
    try {
      const items = req.body.items
      const shippingAddress = req.body.shippingAddress

      const shippingMethods = await this.shipmentService.getShippingMethods(items, shippingAddress)
      sendSuccessResponse(res, shippingMethods)
    } catch (error) {
      console.error("Error retrieving shipping methods:", error)
      sendErrorResponse(res, "Failed to retrieve shipping methods", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Track shipment
   * @param req - Express request
   * @param res - Express response
   */
  async trackShipment(req: Request, res: Response): Promise<void> {
    try {
      const trackingNumber = req.params.tracking_number
      const carrier = req.query.carrier as string

      const trackingInfo = await this.shipmentService.trackShipment(trackingNumber, carrier)
      sendSuccessResponse(res, trackingInfo)
    } catch (error) {
      console.error("Error tracking shipment:", error)

      if (error instanceof Error) {
        sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST)
      } else {
        sendErrorResponse(res, "Failed to track shipment", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }
    }
  }

  /**
   * Get invoice by order ID
   * @param req - Express request
   * @param res - Express response
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.order_id

      // Check if order exists
      const order = await this.orderService.findById(orderId)
      if (!order) {
        sendNotFoundResponse(res, "Order not found")
        return
      }

      // Check if user has permission to view this invoice
      if (req.user && req.user.role !== "admin" && req.user.userId !== order.customerId) {
        sendErrorResponse(
          res,
          "You don't have permission to view this invoice",
          HttpStatusCode.FORBIDDEN,
          "FORBIDDEN"
        )
        return
      }

      const invoice = await this.invoiceService.getInvoiceByOrderNumber(order.orderNumber)
      if (!invoice) {
        sendNotFoundResponse(res, "Invoice not found")
        return
      }

      sendSuccessResponse(res, invoice)
    } catch (error) {
      console.error("Error retrieving invoice:", error)
      sendErrorResponse(res, "Failed to retrieve invoice", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }
}