import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryIdSchema,
  bulkUpdateSchema,
} from "../schemas/category.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendErrorResponse } from "../utils/responseHandler"

export class CategoryMiddleware {
  /**
   * Validate create category request
   */
  static validateCreateCategory(req: Request, res: Response, next: NextFunction): void {
    try {
      createCategorySchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST, "VALIDATION_ERROR", errorMessages)
      } else {
        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST)
      }
    }
  }

  /**
   * Validate update category request
   */
  static validateUpdateCategory(req: Request, res: Response, next: NextFunction): void {
    try {
      updateCategorySchema.partial().parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST, "VALIDATION_ERROR", errorMessages)
      } else {
        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST)
      }
    }
  }

  /**
   * Validate category query parameters
   */
  static validateCategoryQuery(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = categoryQuerySchema.parse({
        search: req.query.search,
        parentId: req.query.parentId,
        level: req.query.level ? Number(req.query.level) : undefined,
        isActive: req.query.isActive === "false" ? false : true,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      })

      // Store the validated query in a custom property
      ;(req as any).validatedQuery = query
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
      } else {
        sendErrorResponse(res, "Invalid query parameters", HttpStatusCode.BAD_REQUEST)
      }
    }
  }

  /**
   * Validate category ID parameter
   */
  static validateCategoryId(req: Request, res: Response, next: NextFunction): void {
    try {
      categoryIdSchema.parse({ category_id: req.params.category_id })
      next()
    } catch (error) {
      sendErrorResponse(res, "Invalid category ID", HttpStatusCode.BAD_REQUEST)
    }
  }

  /**
   * Validate bulk update request
   */
  static validateBulkUpdate(req: Request, res: Response, next: NextFunction): void {
    try {
      bulkUpdateSchema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        sendErrorResponse(res, "Invalid update data", HttpStatusCode.BAD_REQUEST, "VALIDATION_ERROR", errorMessages)
      } else {
        sendErrorResponse(res, "Invalid update data", HttpStatusCode.BAD_REQUEST)
      }
    }
  }

  /**
   * Check if user is an admin
   */
  static isAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== "admin") {
      sendErrorResponse(res, "Only administrators can perform this action", HttpStatusCode.FORBIDDEN, "FORBIDDEN")
    } else {
      next()
    }
  }
}
