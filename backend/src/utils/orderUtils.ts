/**
 * Generate a unique order number
 * @returns Unique order number
 */
export function generateOrderNumber(): string {
    const prefix = "ORD"
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
  
    return `${prefix}-${timestamp}-${random}`
  }
  
  /**
   * Format currency amount
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted currency string
   */
  export function formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }
  
  /**
   * Format date
   * @param date - Date to format
   * @returns Formatted date string
   */
  export function formatDate(date: Date | string): string {
    if (typeof date === "string") {
      date = new Date(date)
    }
  
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }
  
  /**
   * Calculate estimated delivery date
   * @param shippingMethod - Shipping method
   * @returns Estimated delivery date
   */
  export function calculateEstimatedDelivery(shippingMethod: string): Date {
    const today = new Date()
    let daysToAdd = 3 // Default for standard shipping
  
    switch (shippingMethod.toLowerCase()) {
      case "express":
        daysToAdd = 2
        break
      case "overnight":
        daysToAdd = 1
        break
      case "standard":
      default:
        daysToAdd = 3
        break
    }
  
    const result = new Date(today)
    result.setDate(result.getDate() + daysToAdd)
  
    // Skip weekends
    const day = result.getDay()
    if (day === 0) {
      // Sunday
      result.setDate(result.getDate() + 1)
    } else if (day === 6) {
      // Saturday
      result.setDate(result.getDate() + 2)
    }
  
    return result
  }
  
  