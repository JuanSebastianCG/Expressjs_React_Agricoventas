import { PrismaClient, PaymentStatus, PaymentMethod } from "@prisma/client"
import type { UpdatePaymentDto, RefundOrderDto } from "../schemas/order.schema"
import { PaymentGatewayFactory } from "../utils/paymentGatewayFactory"

// Initialize Prisma client
const prisma = new PrismaClient()

export class PaymentService {
  /**
   * Process payment for an order
   * @param order - Order object
   * @param paymentData - Payment data
   * @returns Payment result
   */
  async processPayment(order: any, paymentData: UpdatePaymentDto) {
    try {
      // Get payment gateway based on payment method
      const paymentGateway = PaymentGatewayFactory.getGateway(order.paymentMethod)

      // Process payment through the gateway
      const paymentResult = await paymentGateway.processPayment({
        amount: order.totalAmount,
        currency: "USD", // Default currency, can be made configurable
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        paymentDetails: paymentData.paymentDetails,
      })

      // Return payment result
      return {
        status: paymentResult.success ? PaymentStatus.PAID : PaymentStatus.FAILED,
        details: {
          transactionId: paymentResult.transactionId,
          processorResponse: paymentResult.processorResponse,
          timestamp: new Date(),
          ...paymentResult.additionalDetails,
        },
      }
    } catch (error) {
      console.error("Payment processing error:", error)

      return {
        status: PaymentStatus.FAILED,
        details: {
          error: error instanceof Error ? error.message : "Unknown payment error",
          timestamp: new Date(),
        },
      }
    }
  }

  /**
   * Process refund for an order
   * @param order - Order object
   * @param refundData - Refund data
   * @returns Refund result
   */
  async processRefund(order: any, refundData: RefundOrderDto) {
    try {
      // Get payment gateway based on payment method
      const paymentGateway = PaymentGatewayFactory.getGateway(order.paymentMethod)

      // Get original transaction ID from payment details
      const transactionId = order.paymentDetails?.transactionId

      if (!transactionId) {
        throw new Error("Original transaction ID not found")
      }

      // Process refund through the gateway
      const refundResult = await paymentGateway.processRefund({
        amount: refundData.refundAmount,
        currency: "USD", // Default currency, can be made configurable
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionId,
        reason: refundData.refundReason,
      })

      // Return refund result
      return {
        success: refundResult.success,
        refundId: refundResult.refundId,
        details: {
          refundId: refundResult.refundId,
          processorResponse: refundResult.processorResponse,
          timestamp: new Date(),
          ...refundResult.additionalDetails,
        },
      }
    } catch (error) {
      console.error("Refund processing error:", error)

      throw new Error(error instanceof Error ? error.message : "Unknown refund error")
    }
  }

  /**
   * Get payment methods available for a customer
   * @param customerId - Customer ID
   * @returns Available payment methods
   */
  async getAvailablePaymentMethods(customerId: string) {
    // This could be customized based on customer location, preferences, etc.
    return Object.values(PaymentMethod)
  }
}

