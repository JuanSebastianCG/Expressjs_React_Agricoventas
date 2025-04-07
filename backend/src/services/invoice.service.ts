import { PrismaClient, InvoiceStatus } from "@prisma/client"
import { generateInvoiceNumber, generateInvoicePdf } from "../utils/invoiceUtils"

// Initialize Prisma client
const prisma = new PrismaClient()

export class InvoiceService {
  /**
   * Create invoice for an order
   * @param tx - Prisma transaction client
   * @param order - Order object
   * @returns Created invoice
   */
  async createInvoice(tx: any, order: any) {
    // Generate unique invoice number
    const invoiceNumber = generateInvoiceNumber()

    // Create invoice
    const invoice = await tx.Invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerId: order.customerId,
        amount: order.totalAmount,
        status: InvoiceStatus.PENDING,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      },
    })

    // Generate PDF invoice (async)
    this.generateInvoicePdf(invoice.id, order).catch((error) => {
      console.error("Error generating invoice PDF:", error)
    })

    return invoice
  }

  /**
   * Generate PDF invoice
   * @param invoiceId - Invoice ID
   * @param order - Order object
   */
  private async generateInvoicePdf(invoiceId: string, order: any) {
    try {
      // Generate PDF
      const pdfUrl = await generateInvoicePdf(order)

      // Update invoice with PDF URL
      await prisma.Invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl },
      })
    } catch (error) {
      console.error("Error generating invoice PDF:", error)
    }
  }

  /**
   * Get invoice by order number
   * @param orderNumber - Order number
   * @returns Invoice if found, null otherwise
   */
  async getInvoiceByOrderNumber(orderNumber: string) {
    const order = await prisma.Order.findUnique({
      where: { orderNumber },
      select: { id: true },
    })

    if (!order) {
      return null
    }

    return prisma.Invoice.findFirst({
      where: { orderId: order.id },
    })
  }

  /**
   * Update invoice status
   * @param orderNumber - Order number
   * @param status - New invoice status
   * @returns Updated invoice
   */
  async updateInvoiceStatus(orderNumber: string, status: string) {
    const invoice = await this.getInvoiceByOrderNumber(orderNumber)

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    return prisma.Invoice.update({
      where: { id: invoice.id },
      data: {
        status: status as InvoiceStatus,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
    })
  }

  /**
   * Get invoice by ID
   * @param id - Invoice ID
   * @returns Invoice if found, null otherwise
   */
  async getInvoiceById(id: string) {
    return prisma.Invoice.findUnique({
      where: { id },
    })
  }

  /**
   * Get invoices with filtering and pagination
   * @param params - Query parameters
   * @returns Invoices and pagination info
   */
  async getInvoices(params: any) {
    const { customerId, status, fromDate, toDate, page = 1, limit = 10 } = params

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = new Date(fromDate)
      if (toDate) where.createdAt.lte = new Date(toDate)
    }

    // Get invoices and total count
    const [invoices, total] = await Promise.all([
      prisma.Invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.Invoice.count({ where }),
    ])

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }
}

