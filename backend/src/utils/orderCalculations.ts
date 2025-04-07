/**
 * Calculate order totals
 * @param subtotal - Order subtotal
 * @param discountAmount - Discount amount (optional)
 * @returns Order totals
 */
export function calculateOrderTotals(subtotal: number, discountAmount = 0) {
    // Calculate tax (e.g., 8%)
    const taxRate = 0.08
    const tax = subtotal * taxRate
  
    // Calculate shipping cost (simplified example)
    let shippingCost = 0
    if (subtotal < 50) {
      shippingCost = 5.99
    } else if (subtotal < 100) {
      shippingCost = 3.99
    }
    // Free shipping for orders over $100
  
    // Apply discount
    const discountedSubtotal = subtotal - discountAmount
  
    // Calculate total amount
    const totalAmount = discountedSubtotal + tax + shippingCost
  
    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      tax,
      shippingCost,
      totalAmount,
    }
  }
  
  /**
   * Calculate refund amount
   * @param order - Order object
   * @param items - Items to refund (optional)
   * @returns Refund amount
   */
  export function calculateRefundAmount(order: any, items?: any[]) {
    // If no specific items are provided, refund the entire order
    if (!items || items.length === 0) {
      return order.totalAmount
    }
  
    // Calculate refund for specific items
    let refundSubtotal = 0
  
    for (const refundItem of items) {
      const orderItem = order.items.find((item: any) => item.id === refundItem.id)
  
      if (orderItem) {
        const quantity = Math.min(refundItem.quantity, orderItem.quantity)
        refundSubtotal += orderItem.unitPrice * quantity
      }
    }
  
    // Calculate proportional tax and shipping
    const refundProportion = refundSubtotal / order.subtotal
    const refundTax = order.tax * refundProportion
    const refundShipping = order.shippingCost * refundProportion
  
    // Calculate total refund amount
    const refundAmount = refundSubtotal + refundTax + refundShipping
  
    return refundAmount
  }
  
  