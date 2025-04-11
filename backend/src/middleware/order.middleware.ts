import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import {
  createOrderSchema,
  updateOrderSchema,
  orderQuerySchema,
  orderIdSchema,
  orderNumberSchema,
  cancelOrderSchema,
  refundOrderSchema,
  updatePaymentSchema,
  updateShipmentSchema,
} from "../schemas/order.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendErrorResponse } from "../utils/responseHandler"

export class OrderMiddleware {
  /**
   * Validate order creation data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateCreateOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      createOrderSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid order data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid order data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate order update data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateUpdateOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      updateOrderSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid order data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid order data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate order query parameters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateOrderQuery(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = orderQuerySchema.parse({
        customerId: req.query.customerId,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        fulfillmentStatus: req.query.fulfillmentStatus,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      })

      // Add parsed values back to req.query
      req.query = { 
        ...req.query, 
        ...Object.fromEntries(
          Object.entries(query).map(([key, value]) => [key, value?.toString()])
        ) 
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid query parameters",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid query parameters", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate order ID parameter
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateOrderId(req: Request, res: Response, next: NextFunction): void {
    try {
      orderIdSchema.parse({ order_id: req.params.order_id })
      next()
    } catch (error) {
      sendErrorResponse(res, "Invalid order ID", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate order number parameter
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateOrderNumber(req: Request, res: Response, next: NextFunction): void {
    try {
      orderNumberSchema.parse({ order_number: req.params.order_number })
      next()
    } catch (error) {
      sendErrorResponse(res, "Invalid order number", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate cancel order data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateCancelOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      cancelOrderSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid cancel data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid cancel data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate refund order data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateRefundOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      refundOrderSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid refund data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid refund data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate payment update data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validatePaymentUpdate(req: Request, res: Response, next: NextFunction): void {
    try {
      updatePaymentSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid payment data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid payment data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate shipment update data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateShipmentUpdate(req: Request, res: Response, next: NextFunction): void {
    try {
      updateShipmentSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid shipment data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid shipment data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Check if user is authenticated
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static isAuthenticated(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      sendErrorResponse(res, "Authentication required", HttpStatusCode.UNAUTHORIZED, "UNAUTHORIZED")
      return
    }

    next()
  }

  /**
   * Check if user is an admin
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static isAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== "admin") {
      sendErrorResponse(res, "Admin access required", HttpStatusCode.FORBIDDEN, "FORBIDDEN")
      return
    }

    next()
  }

  /**
   * Check if user is a buyer
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static isBuyer(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== "buyer") {
      sendErrorResponse(res, "Buyer access required", HttpStatusCode.FORBIDDEN, "FORBIDDEN")
      return
    }

    next()
  }
}