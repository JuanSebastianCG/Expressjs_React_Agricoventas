import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
} from "../schemas/product.schema";
import HttpStatusCode from "../utils/HttpStatusCode";
import { sendErrorResponse } from "../utils/responseHandler";
import { isValidObjectId } from "mongoose";

export class ProductMiddleware {
  /**
   * Validate product creation data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateCreateProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      createProductSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid product data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }

      sendErrorResponse(res, "Invalid product data", HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Validate product update data
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateUpdateProduct(req: Request, res: Response, next: NextFunction): void {
    try {
      updateProductSchema.partial().parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid product data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }

      sendErrorResponse(res, "Invalid product data", HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Validate product query parameters
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateProductQuery(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = productQuerySchema.parse({
        category: req.query.category,
        search: req.query.search,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        availability_date: req.query.availability_date,
        page: req.query.page,
        limit: req.query.limit,
      });

      // Add parsed values back to req.query
      req.query = {
        ...req.query,
        ...query,
        min_price: query.min_price?.toString(),
        max_price: query.max_price?.toString(),
        page: query.page?.toString(),
        limit: query.limit?.toString(),
      };
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid query parameters",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
        return;
      }

      sendErrorResponse(res, "Invalid query parameters", HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Validate product ID parameter
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static validateProductId(req: Request, res: Response, next: NextFunction): void {
    const { product_id } = req.params;
    if (!product_id || !isValidObjectId(product_id)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid product ID",
          code: "INVALID_PRODUCT_ID",
        },
      });
      return;
    }
    next();
  }

  /**
   * Check if user is a farmer
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  static isFarmer(req: Request, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== "farmer") {
      res.status(403).json({
        success: false,
        error: {
          message: "Access denied",
          code: "ACCESS_DENIED",
        },
      });
      return;
    }
    next();
  }
}