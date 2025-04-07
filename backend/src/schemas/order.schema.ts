import { z } from "zod"
import { OrderStatus, PaymentMethod, PaymentStatus, FulfillmentStatus } from "@prisma/client"

// Address schema
const addressSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  line1: z.string().min(1, { message: "Address line 1 is required" }),
  line2: z.string().optional(),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  postalCode: z.string().min(1, { message: "Postal code is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  isDefault: z.boolean().optional().default(false),
})

// Order item schema
const orderItemSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required" }),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
})

// Base schema for order validation
export const orderSchema = z.object({
  customerId: z.string().min(1, { message: "Customer ID is required" }),
  items: z.array(orderItemSchema).min(1, { message: "At least one item is required" }),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  notes: z.string().optional(),
})

// Schema for creating an order
export const createOrderSchema = orderSchema

// Schema for updating an order
export const updateOrderSchema = z.object({
  status: z
    .nativeEnum(OrderStatus, {
      errorMap: () => ({ message: "Invalid order status" }),
    })
    .optional(),
  paymentStatus: z
    .nativeEnum(PaymentStatus, {
      errorMap: () => ({ message: "Invalid payment status" }),
    })
    .optional(),
  fulfillmentStatus: z
    .nativeEnum(FulfillmentStatus, {
      errorMap: () => ({ message: "Invalid fulfillment status" }),
    })
    .optional(),
  trackingNumber: z.string().optional(),
  shippingProvider: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  canceledAt: z.string().datetime().optional(),
  cancelReason: z.string().optional(),
  refundAmount: z.number().positive().optional(),
  refundReason: z.string().optional(),
  refundedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Schema for order query parameters
export const orderQuerySchema = z.object({
  customerId: z.string().optional(),
  status: z
    .nativeEnum(OrderStatus, {
      errorMap: () => ({ message: "Invalid order status" }),
    })
    .optional(),
  paymentStatus: z
    .nativeEnum(PaymentStatus, {
      errorMap: () => ({ message: "Invalid payment status" }),
    })
    .optional(),
  fulfillmentStatus: z
    .nativeEnum(FulfillmentStatus, {
      errorMap: () => ({ message: "Invalid fulfillment status" }),
    })
    .optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt", "totalAmount", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

// Schema for order ID parameter
export const orderIdSchema = z.object({
  order_id: z.string().min(1, { message: "Order ID is required" }),
})

// Schema for order number parameter
export const orderNumberSchema = z.object({
  order_number: z.string().min(1, { message: "Order number is required" }),
})

// Schema for canceling an order
export const cancelOrderSchema = z.object({
  cancelReason: z.string().min(1, { message: "Cancel reason is required" }),
})

// Schema for refunding an order
export const refundOrderSchema = z.object({
  refundAmount: z.number().positive("Refund amount must be positive"),
  refundReason: z.string().min(1, { message: "Refund reason is required" }),
})

// Schema for updating order payment
export const updatePaymentSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus, {
    errorMap: () => ({ message: "Invalid payment status" }),
  }),
  paymentDetails: z.record(z.any()).optional(),
})

// Schema for updating order shipment
export const updateShipmentSchema = z.object({
  trackingNumber: z.string().optional(),
  shippingProvider: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  fulfillmentStatus: z
    .nativeEnum(FulfillmentStatus, {
      errorMap: () => ({ message: "Invalid fulfillment status" }),
    })
    .optional(),
})

// Types derived from schemas
export type CreateOrderDto = z.infer<typeof createOrderSchema>
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>
export type OrderQueryParams = z.infer<typeof orderQuerySchema>
export type OrderIdParam = z.infer<typeof orderIdSchema>
export type OrderNumberParam = z.infer<typeof orderNumberSchema>
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>
export type RefundOrderDto = z.infer<typeof refundOrderSchema>
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>
export type UpdateShipmentDto = z.infer<typeof updateShipmentSchema>

// Order response type
export interface OrderResponse {
  id: string
  orderNumber: string
  customerId: string
  status: OrderStatus
  totalAmount: number
  subtotal: number
  tax: number
  shippingCost: number
  discount: number
  notes?: string
  shippingAddress: any
  billingAddress?: any
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentDetails?: any
  fulfillmentStatus: FulfillmentStatus
  trackingNumber?: string
  shippingProvider?: string
  estimatedDelivery?: Date
  deliveredAt?: Date
  canceledAt?: Date
  cancelReason?: string
  refundAmount?: number
  refundReason?: string
  refundedAt?: Date
  metadata?: any
  items: OrderItemResponse[]
  createdAt: Date
  updatedAt: Date
}

// Order item response type
export interface OrderItemResponse {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  farmerId: string
  metadata?: any
}

