import { PrismaClient, ShipmentStatus } from "@prisma/client"
import type { UpdateShipmentDto } from "../schemas/order.schema"
import { ShippingProviderFactory } from "../utils/shippingProviderFactory"

// Initialize Prisma client
const prisma = new PrismaClient()

export class ShipmentService {
  /**
   * Create or update shipment for an order
   * @param order - Order object
   * @param shipmentData - Shipment data
   * @returns Shipment result
   */
  async createOrUpdateShipment(order: any, shipmentData: UpdateShipmentDto) {
    try {
      // Check if shipment already exists
      const existingShipment = await prisma.Shipment.findFirst({
        where: { orderId: order.id },
      })

      // Get shipping provider if specified
      let shippingProviderResult = null
      if (shipmentData.shippingProvider) {
        const shippingProvider = ShippingProviderFactory.getProvider(shipmentData.shippingProvider)

        // Create shipment with the provider
        shippingProviderResult = await shippingProvider.createShipment({
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: order.items,
          shippingAddress: order.shippingAddress,
          trackingNumber: shipmentData.trackingNumber,
        })
      }

      // Determine shipment status
      let status = ShipmentStatus.PROCESSING
      if (shipmentData.trackingNumber) {
        status = ShipmentStatus.IN_TRANSIT
      }

      if (existingShipment) {
        // Update existing shipment
        return prisma.Shipment.update({
          where: { id: existingShipment.id },
          data: {
            trackingNumber: shipmentData.trackingNumber || existingShipment.trackingNumber,
            carrier: shipmentData.shippingProvider || existingShipment.carrier,
            status,
            estimatedDelivery: shipmentData.estimatedDelivery
              ? new Date(shipmentData.estimatedDelivery)
              : existingShipment.estimatedDelivery,
            metadata: shippingProviderResult
              ? {
                  ...existingShipment.metadata,
                  ...shippingProviderResult,
                }
              : existingShipment.metadata,
          },
        })
      } else {
        // Create new shipment
        return prisma.Shipment.create({
          data: {
            orderId: order.id,
            trackingNumber: shipmentData.trackingNumber,
            carrier: shipmentData.shippingProvider,
            status,
            shippingMethod: "Standard", // Default, can be made configurable
            shippingCost: order.shippingCost,
            estimatedDelivery: shipmentData.estimatedDelivery ? new Date(shipmentData.estimatedDelivery) : undefined,
            shippingAddress: order.shippingAddress,
            metadata: shippingProviderResult,
          },
        })
      }
    } catch (error) {
      console.error("Shipment processing error:", error)

      throw new Error(error instanceof Error ? error.message : "Unknown shipment error")
    }
  }

  /**
   * Track shipment
   * @param trackingNumber - Tracking number
   * @param carrier - Shipping carrier
   * @returns Tracking information
   */
  async trackShipment(trackingNumber: string, carrier: string) {
    try {
      const shippingProvider = ShippingProviderFactory.getProvider(carrier)

      // Get tracking information from the provider
      return shippingProvider.trackShipment(trackingNumber)
    } catch (error) {
      console.error("Shipment tracking error:", error)

      throw new Error(error instanceof Error ? error.message : "Unknown tracking error")
    }
  }

  /**
   * Get shipment by order ID
   * @param orderId - Order ID
   * @returns Shipment if found, null otherwise
   */
  async getShipmentByOrderId(orderId: string) {
    return prisma.Shipment.findFirst({
      where: { orderId },
    })
  }

  /**
   * Get available shipping methods
   * @param items - Order items
   * @param shippingAddress - Shipping address
   * @returns Available shipping methods with rates
   */
  async getShippingMethods(items: any[], shippingAddress: any) {
    // This would typically call external shipping APIs to get rates
    // For now, return some default shipping methods
    return [
      {
        id: "standard",
        name: "Standard Shipping",
        price: 5.99,
        estimatedDeliveryDays: "3-5 business days",
      },
      {
        id: "express",
        name: "Express Shipping",
        price: 12.99,
        estimatedDeliveryDays: "1-2 business days",
      },
      {
        id: "overnight",
        name: "Overnight Shipping",
        price: 24.99,
        estimatedDeliveryDays: "Next business day",
      },
    ]
  }
}

