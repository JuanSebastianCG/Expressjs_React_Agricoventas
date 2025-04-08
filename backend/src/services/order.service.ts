import { PrismaClient, OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client"
import type {
  CreateOrderDto,
  UpdateOrderDto,
  OrderQueryParams,
  CancelOrderDto,
  RefundOrderDto,
  UpdatePaymentDto,
  UpdateShipmentDto,
} from "../schemas/order.schema"
import { generateOrderNumber } from "../utils/orderUtils"
import { calculateOrderTotals } from "../utils/orderCalculations"
import { PaymentService } from "./payment.service"
import { ShipmentService } from "./shipment.service"
import { InvoiceService } from "./invoice.service"
import { NotificationService } from "./notification.service"

// Initialize Prisma client
const prisma = new PrismaClient()

export class OrderService {
  private paymentService: PaymentService
  private shipmentService: ShipmentService
  private invoiceService: InvoiceService
  private notificationService: NotificationService

  constructor() {
    this.paymentService = new PaymentService()
    this.shipmentService = new ShipmentService()
    this.invoiceService = new InvoiceService()
    this.notificationService = new NotificationService()
  }

  /**
   * Create a new order
   * @param data - Order data
   * @returns Created order
   */
  async create(data: CreateOrderDto) {
    // Start a transaction
    return prisma.$transaction(async (tx) => {
      // 1. Validate products and calculate totals
      const orderItems = []
      let subtotal = 0

      // Fetch products and validate availability
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`)
        }

        if (!product.isActive) {
          throw new Error(`Product ${product.name} is not available`)
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for product ${product.name}`)
        }

        // Calculate item total
        const itemTotal = product.price * item.quantity
        subtotal += itemTotal

        // Prepare order item
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal,
          farmerId: product.farmer_id,
        })

        // Update product quantity
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: product.quantity - item.quantity },
        })
      }

      // 2. Calculate order totals
      const { totalAmount, tax, shippingCost } = calculateOrderTotals(subtotal)

      // 3. Generate unique order number
      const orderNumber = generateOrderNumber()

      // 4. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          status: OrderStatus.PENDING,
          totalAmount,
          subtotal,
          tax,
          shippingCost,
          discount: 0, // Default value, can be updated later
          notes: data.notes,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress || data.shippingAddress,
          paymentMethod: data.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      })

      // 5. Create invoice
      await this.invoiceService.createInvoice(tx, order)

      // 6. Send notifications
      await this.notificationService.sendOrderConfirmation(order)

      return order
    })
  }

  /**
   * Get an order by ID
   * @param id - Order ID
   * @returns Order if found, null otherwise
   */
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })
  }

  /**
   * Get an order by order number
   * @param orderNumber - Order number
   * @returns Order if found, null otherwise
   */
  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    })
  }

  /**
   * Get orders with filtering and pagination
   * @param params - Query parameters
   * @returns Orders and pagination info
   */
  async findAll(params: OrderQueryParams) {
    const {
      customerId,
      status,
      paymentStatus,
      fulfillmentStatus,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus
    }

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = new Date(fromDate)
      if (toDate) where.createdAt.lte = new Date(toDate)
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {}
      if (minAmount !== undefined) where.totalAmount.gte = minAmount
      if (maxAmount !== undefined) where.totalAmount.lte = maxAmount
    }

    // Search by order number
    if (search) {
      where.OR = [{ orderNumber: { contains: search, mode: "insensitive" } }]
    }

    // Get orders and total count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Update an order
   * @param id - Order ID
   * @param data - Updates for the order
   * @returns Updated order
   */
  async update(id: string, data: UpdateOrderDto) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    })
  }

  /**
   * Process payment for an order
   * @param id - Order ID
   * @param paymentData - Payment data
   * @returns Updated order
   */
  async processPayment(id: string, paymentData: UpdatePaymentDto) {
    const order = await this.findById(id)

    if (!order) {
      throw new Error("Order not found")
    }

    // Process payment through payment service
    const paymentResult = await this.paymentService.processPayment(order, paymentData)

    // Update order with payment result
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: paymentResult.status,
        paymentDetails: paymentResult.details,
        status: paymentResult.status === PaymentStatus.PAID ? OrderStatus.PROCESSING : order.status,
      },
      include: {
        items: true,
      },
    })

    // If payment is successful, update invoice status
    if (paymentResult.status === PaymentStatus.PAID) {
      await this.invoiceService.updateInvoiceStatus(order.orderNumber, "PAID")

      // Send payment confirmation notification
      await this.notificationService.sendPaymentConfirmation(updatedOrder)
    }

    return updatedOrder
  }

  /**
   * Update shipment information for an order
   * @param id - Order ID
   * @param shipmentData - Shipment data
   * @returns Updated order
   */
  async updateShipment(id: string, shipmentData: UpdateShipmentDto) {
    const order = await this.findById(id)

    if (!order) {
      throw new Error("Order not found")
    }

    // Create or update shipment through shipment service
    const shipmentResult = await this.shipmentService.createOrUpdateShipment(order, shipmentData)

    // Update order with shipment result
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber: shipmentData.trackingNumber,
        shippingProvider: shipmentData.shippingProvider,
        estimatedDelivery: shipmentData.estimatedDelivery ? new Date(shipmentData.estimatedDelivery) : undefined,
        fulfillmentStatus: shipmentData.fulfillmentStatus || order.fulfillmentStatus,
        status: shipmentData.fulfillmentStatus === FulfillmentStatus.FULFILLED ? OrderStatus.COMPLETED : order.status,
      },
      include: {
        items: true,
      },
    })

    // Send shipment notification
    if (shipmentData.trackingNumber && shipmentData.trackingNumber !== order.trackingNumber) {
      await this.notificationService.sendShipmentUpdate(updatedOrder)
    }

    return updatedOrder
  }

  /**
   * Cancel an order
   * @param id - Order ID
   * @param cancelData - Cancel data
   * @returns Updated order
   */
  async cancelOrder(id: string, cancelData: CancelOrderDto) {
    const order = await this.findById(id)

    if (!order) {
      throw new Error("Order not found")
    }

    // Check if order can be canceled
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.REFUNDED) {
      throw new Error("Cannot cancel a completed or refunded order")
    }

    if (order.fulfillmentStatus === FulfillmentStatus.FULFILLED) {
      throw new Error("Cannot cancel an order that has been fulfilled")
    }

    // Start a transaction
    return prisma.$transaction(async (tx) => {
      // Restore product quantities
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELED,
          canceledAt: new Date(),
          cancelReason: cancelData.cancelReason,
        },
        include: {
          items: true,
        },
      })

      // Update invoice status
      await this.invoiceService.updateInvoiceStatus(order.orderNumber, "CANCELED")

      // Send cancellation notification
      await this.notificationService.sendOrderCancellation(updatedOrder)

      return updatedOrder
    })
  }

  /**
   * Process refund for an order
   * @param id - Order ID
   * @param refundData - Refund data
   * @returns Updated order
   */
  async processRefund(id: string, refundData: RefundOrderDto) {
    const order = await this.findById(id)

    if (!order) {
      throw new Error("Order not found")
    }

    // Check if order can be refunded
    if (order.status === OrderStatus.CANCELED || order.status === OrderStatus.REFUNDED) {
      throw new Error("Cannot refund a canceled or already refunded order")
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new Error("Cannot refund an order that hasn't been paid")
    }

    // Validate refund amount
    if (refundData.refundAmount > order.totalAmount) {
      throw new Error("Refund amount cannot exceed the order total")
    }

    // Process refund through payment service
    const refundResult = await this.paymentService.processRefund(order, refundData)

    // Update order with refund result
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.REFUNDED,
        paymentStatus:
          refundData.refundAmount === order.totalAmount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        refundedAt: new Date(),
      },
      include: {
        items: true,
      },
    })

    // Update invoice status
    await this.invoiceService.updateInvoiceStatus(
      order.orderNumber,
      refundData.refundAmount === order.totalAmount ? "REFUNDED" : "PAID",
    )

    // Send refund notification
    await this.notificationService.sendRefundConfirmation(updatedOrder)

    return updatedOrder
  }

  /**
   * Mark order as delivered
   * @param id - Order ID
   * @returns Updated order
   */
  async markAsDelivered(id: string) {
    const order = await this.findById(id)

    if (!order) {
      throw new Error("Order not found")
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new Error("Only completed orders can be marked as delivered")
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        deliveredAt: new Date(),
        fulfillmentStatus: FulfillmentStatus.FULFILLED,
      },
      include: {
        items: true,
      },
    })

    // Send delivery confirmation notification
    await this.notificationService.sendDeliveryConfirmation(updatedOrder)

    return updatedOrder
  }

  /**
   * Get order analytics
   * @param customerId - Optional customer ID to filter analytics
   * @param fromDate - Start date for analytics
   * @param toDate - End date for analytics
   * @returns Order analytics data
   */
  
  async getOrderAnalytics(customerId?: string, fromDate?: string, toDate?: string) {
    const where: any = {}
  
    if (customerId) {
      where.customerId = customerId
    }
  
    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = new Date(fromDate)
      if (toDate) where.createdAt.lte = new Date(toDate)
    }
  
    // Get total orders and revenue
    const [totalOrders, totalRevenue, ordersByStatus, ordersByPaymentMethod] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: {
          ...where,
          status: { not: OrderStatus.CANCELED },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.order.groupBy({
        by: ["paymentMethod"],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
    ])
  
    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        order: {
          ...where,
          status: { not: OrderStatus.CANCELED },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    })
  
    // Get sales by date using MongoDB aggregation
    const salesByDate = await prisma.order.aggregateRaw({
      pipeline: [
        // Match orders that aren't canceled
        {
          $match: {
            status: { $ne: OrderStatus.CANCELED },
            ...(customerId ? { customerId: customerId } : {}),
            ...(fromDate || toDate ? {
              createdAt: {
                ...(fromDate ? { $gte: new Date(fromDate) } : {}),
                ...(toDate ? { $lte: new Date(toDate) } : {})
              }
            } : {})
          }
        },
        // Group by date
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            date: { $first: "$createdAt" },
            orderCount: { $sum: 1 },
            totalSales: { $sum: "$totalAmount" }
          }
        },
        // Project to format the output
        {
          $project: {
            _id: 0,
            date: 1,
            orderCount: 1,
            totalSales: 1
          }
        },
        // Sort by date
        {
          $sort: { date: 1 }
        }
      ]
    });
  
    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      ordersByStatus,
      ordersByPaymentMethod,
      topProducts,
      salesByDate,
    }
  }

  /**
   * Get farmer's orders
   * @param farmerId - Farmer ID
   * @param params - Query parameters
   * @returns Orders and pagination info
   */
  async getFarmerOrders(farmerId: string, params: OrderQueryParams) {
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      items: {
        some: {
          farmerId,
        },
      },
    }

    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus
    }

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = new Date(fromDate)
      if (toDate) where.createdAt.lte = new Date(toDate)
    }

    // Get orders and total count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            where: {
              farmerId,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }
}

