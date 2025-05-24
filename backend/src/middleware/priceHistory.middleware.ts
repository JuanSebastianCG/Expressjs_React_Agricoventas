import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import {
  createPriceHistorySchema,
  updatePriceHistorySchema,
  priceHistoryQuerySchema,
  priceStatisticsQuerySchema,
  priceHistoryIdSchema,
} from "../schemas/priceHistory.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendErrorResponse } from "../utils/responseHandler"

export class PriceHistoryMiddleware {
  /**
   * Validate price history creation data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateCreatePriceHistory(req: Request, res: Response, next: NextFunction): void {
    try {
      createPriceHistorySchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid price history data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid price history data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate price history update data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateUpdatePriceHistory(req: Request, res: Response, next: NextFunction): void {
    try {
      updatePriceHistorySchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(
          res,
          "Invalid price history data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages,
        )
        return
      }

      sendErrorResponse(res, "Invalid price history data", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate price history query parameters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validatePriceHistoryQuery(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = priceHistoryQuerySchema.parse({
        product_id: req.query.product_id,
        product_name: req.query.product_name,
        category: req.query.category,
        market_name: req.query.market_name,
        location: req.query.location,
        quality_grade: req.query.quality_grade,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        source: req.query.source,
        page: req.query.page,
        limit: req.query.limit,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      })

      // Store validated query in req for later use
      req.validatedQuery = query
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
   * Validate price statistics query parameters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validatePriceStatisticsQuery(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = priceStatisticsQuerySchema.parse({
        product_id: req.query.product_id,
        product_name: req.query.product_name,
        category: req.query.category,
        market_name: req.query.market_name,
        location: req.query.location,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        period: req.query.period,
        include_trends: req.query.include_trends === "true",
        include_forecasts: req.query.include_forecasts === "true",
      })

      // Store validated query in req for later use
      req.validatedQuery = query
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
   * Validate price history ID parameter
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validatePriceHistoryId(req: Request, res: Response, next: NextFunction): void {
    try {
      priceHistoryIdSchema.parse({ history_id: req.params.history_id })
      next()
    } catch (error) {
      sendErrorResponse(res, "Invalid price history ID", HttpStatusCode.BAD_REQUEST)
    }
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any
    }
  }
}
