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
    // Create a processed query object without modifying req.query
    const processedQuery = {
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      page: Number(req.query.page || '1'),
      limit: Number(req.query.limit || '10'),
      sort_by: (req.query.sort_by as string) || 'createdAt',
      sort_order: (req.query.sort_order as string) || 'desc',
      search: req.query.search as string,
      category: req.query.category as string,
      tags: req.query.tags as string,
      organic: req.query.organic === 'true',
      featured: req.query.featured === 'true',
      availability_date: req.query.availability_date as string
    };
    
    // Attach this processed object to the request for use in controllers
    (req as any).processedQuery = processedQuery;
    
    next();
  } catch (error) {
    next(error);
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