import { sendEmail } from "../utils/emailUtils"
import { sendSms } from "../utils/smsUtils"

export class NotificationService {
  /**
   * Send order confirmation notification
   * @param order - Order object
   */
  async sendOrderConfirmation(order: any) {
    try {
      // Get customer details (would typically come from a user service)
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Order Confirmation #${order.orderNumber}`,
          template: "order-confirmation",
          data: {
            order,
            customer,
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `Your order #${order.orderNumber} has been received and is being processed. Thank you for your purchase!`,
        })
      }

      // Send push notification (would require device tokens)
      // await sendPushNotification({
      //   userId: order.customerId,
      //   title: "Order Confirmation",
      //   body: `Your order #${order.orderNumber} has been received.`,
      //   data: {
      //     orderId: order.id,
      //     orderNumber: order.orderNumber,
      //   },
      // });

      // Notify farmers about new orders
      this.notifyFarmers(order)
    } catch (error) {
      console.error("Error sending order confirmation notification:", error)
    }
  }

  /**
   * Send payment confirmation notification
   * @param order - Order object
   */
  async sendPaymentConfirmation(order: any) {
    try {
      // Get customer details
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Payment Confirmation for Order #${order.orderNumber}`,
          template: "payment-confirmation",
          data: {
            order,
            customer,
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `Payment for your order #${order.orderNumber} has been processed successfully. Thank you!`,
        })
      }
    } catch (error) {
      console.error("Error sending payment confirmation notification:", error)
    }
  }

  /**
   * Send shipment update notification
   * @param order - Order object
   */
  async sendShipmentUpdate(order: any) {
    try {
      // Get customer details
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Shipment Update for Order #${order.orderNumber}`,
          template: "shipment-update",
          data: {
            order,
            customer,
            trackingUrl: this.getTrackingUrl(order.trackingNumber, order.shippingProvider),
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `Your order #${order.orderNumber} has shipped! Track it here: ${this.getTrackingUrl(order.trackingNumber, order.shippingProvider)}`,
        })
      }
    } catch (error) {
      console.error("Error sending shipment update notification:", error)
    }
  }

  /**
   * Send delivery confirmation notification
   * @param order - Order object
   */
  async sendDeliveryConfirmation(order: any) {
    try {
      // Get customer details
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Order #${order.orderNumber} Delivered`,
          template: "delivery-confirmation",
          data: {
            order,
            customer,
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `Your order #${order.orderNumber} has been delivered! Thank you for shopping with us.`,
        })
      }
    } catch (error) {
      console.error("Error sending delivery confirmation notification:", error)
    }
  }

  /**
   * Send order cancellation notification
   * @param order - Order object
   */
  async sendOrderCancellation(order: any) {
    try {
      // Get customer details
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Order #${order.orderNumber} Canceled`,
          template: "order-cancellation",
          data: {
            order,
            customer,
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `Your order #${order.orderNumber} has been canceled. Reason: ${order.cancelReason}`,
        })
      }

      // Notify farmers about canceled orders
      this.notifyFarmers(order, "cancel")
    } catch (error) {
      console.error("Error sending order cancellation notification:", error)
    }
  }

  /**
   * Send refund confirmation notification
   * @param order - Order object
   */
  async sendRefundConfirmation(order: any) {
    try {
      // Get customer details
      const customer = { email: order.shippingAddress.email }

      // Send email notification
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: `Refund Processed for Order #${order.orderNumber}`,
          template: "refund-confirmation",
          data: {
            order,
            customer,
          },
        })
      }

      // Send SMS notification if phone number is available
      if (order.shippingAddress.phoneNumber) {
        await sendSms({
          to: order.shippingAddress.phoneNumber,
          message: `A refund of $${order.refundAmount.toFixed(2)} has been processed for your order #${order.orderNumber}.`,
        })
      }
    } catch (error) {
      console.error("Error sending refund confirmation notification:", error)
    }
  }

  /**
   * Notify farmers about orders
   * @param order - Order object
   * @param type - Notification type
   */
  private async notifyFarmers(order: any, type = "new") {
    try {
      // Group items by farmer
      const itemsByFarmer = order.items.reduce((acc: any, item: any) => {
        if (!acc[item.farmerId]) {
          acc[item.farmerId] = []
        }
        acc[item.farmerId].push(item)
        return acc
      }, {})

      // Send notifications to each farmer
      for (const [farmerId, items] of Object.entries(itemsByFarmer)) {
        // In a real implementation, you would get the farmer's contact details
        // For now, we'll just log the notification
        console.log(`Notifying farmer ${farmerId} about ${type} order #${order.orderNumber}`)
        console.log(`Items: ${JSON.stringify(items)}`)
      }
    } catch (error) {
      console.error("Error notifying farmers:", error)
    }
  }

  /**
   * Get tracking URL for a shipment
   * @param trackingNumber - Tracking number
   * @param carrier - Shipping carrier
   * @returns Tracking URL
   */
  private getTrackingUrl(trackingNumber: string, carrier: string): string {
    // This would be replaced with actual carrier tracking URLs
    const carrierUrls: Record<string, string> = {
      ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    }

    return carrierUrls[carrier.toLowerCase()] || `https://example.com/track?number=${trackingNumber}&carrier=${carrier}`
  }
}

