import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryIdSchema,
} from "../schemas/category.schema";
import HttpStatusCode from "../utils/HttpStatusCode";
import { sendErrorResponse } from "../utils/responseHandler";

export class CategoryMiddleware {
  static async validateCreateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      createCategorySchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid category data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
      } else {
        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST);
      }
    }
  }

  static async validateUpdateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      updateCategorySchema.partial().parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid category data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
      } else {
        sendErrorResponse(res, "Invalid category data", HttpStatusCode.BAD_REQUEST);
      }
    }
  }

  static async validateCategoryQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = categoryQuerySchema.parse({
        search: req.query.search,
        parentId: req.query.parentId,
        level: req.query.level ? Number(req.query.level) : undefined,
        isActive: req.query.isActive === "false" ? false : true,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      });
  
      // Store the validated query in a custom property
      (req as any).validatedQuery = query;
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
      } else {
        sendErrorResponse(res, "Invalid query parameters", HttpStatusCode.BAD_REQUEST);
      }
    }
  }

  static async validateCategoryId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      categoryIdSchema.parse({ category_id: req.params.category_id });
      next();
    } catch (error) {
      sendErrorResponse(res, "Invalid category ID", HttpStatusCode.BAD_REQUEST);
    }
  }

  static async validateBulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, data } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        sendErrorResponse(res, "Invalid category IDs", HttpStatusCode.BAD_REQUEST);
        return;
      }

      updateCategorySchema.partial().parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendErrorResponse(
          res,
          "Invalid update data",
          HttpStatusCode.BAD_REQUEST,
          "VALIDATION_ERROR",
          errorMessages
        );
      } else {
        sendErrorResponse(res, "Invalid update data", HttpStatusCode.BAD_REQUEST);
      }
    }
  }

  static async isAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user || req.user.role !== "admin") {
      sendErrorResponse(
        res,
        "Only administrators can perform this action",
        HttpStatusCode.FORBIDDEN,
        "FORBIDDEN"
      );
    } else {
      next();
    }
  }
}