/**
 * Generate a unique invoice number
 * @returns Unique invoice number
 */
export function generateInvoiceNumber(): string {
    const prefix = "INV"
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
  
    return `${prefix}-${timestamp}-${random}`
  }
  
  /**
   * Generate PDF invoice
   * @param order - Order object
   * @returns URL to the generated PDF
   */
  export async function generateInvoicePdf(order: any): Promise<string> {
    // In a real implementation, this would use a PDF generation library
    // For now, we'll just return a placeholder URL
  
    // Simulate PDF generation delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
  
    // Return a placeholder URL
    return `https://example.com/invoices/${order.orderNumber}.pdf`
  }
  
  /**
   * Calculate invoice due date
   * @param createdAt - Invoice creation date
   * @param paymentTerms - Payment terms in days
   * @returns Due date
   */
  export function calculateDueDate(createdAt: Date, paymentTerms = 30): Date {
    const dueDate = new Date(createdAt)
    dueDate.setDate(dueDate.getDate() + paymentTerms)
    return dueDate
  }
  
  