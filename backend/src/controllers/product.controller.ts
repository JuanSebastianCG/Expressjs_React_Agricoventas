import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import type { CreateProductDto, UpdateProductDto, ProductQueryParams } from "../schemas/product.schema";
import HttpStatusCode from "../utils/HttpStatusCode";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import { ApiError } from "../middleware/error.middleware";
import { logger } from "../config/logger";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create a new product
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productData: CreateProductDto = req.body;

      // Verify that the farmer_id matches the authenticated user
      if (req.user && req.user.userId !== productData.farmer_id) {
        throw new ApiError(
          HttpStatusCode.FORBIDDEN,
          "You can only create products for yourself"
        );
      }

      const product = await this.productService.create(productData);
      sendSuccessResponse(res, { product }, HttpStatusCode.CREATED);
    } catch (error) {
      logger.error("Error creating product:", error);
      next(error);
    }
  }

  /**
   * Get a product by ID
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.product_id;
      const product = await this.productService.findById(productId);

      if (!product) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Product not found");
      }

      // If you have inventory status functionality
      // const inventoryStatus = await this.productService.getInventoryStatus(productId);
      // sendSuccessResponse(res, { product, inventoryStatus });
      
      sendSuccessResponse(res, { product });
    } catch (error) {
      logger.error("Error retrieving product:", error);
      next(error);
    }
  }

  /**
   * Get products with filtering and pagination
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: ProductQueryParams = {
        category: req.query.category as string,
        search: req.query.search as string,
        min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
        max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
        availability_date: req.query.availability_date as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sort_by: req.query.sort_by as "name" | "price" | "quantity" | "createdAt" || "createdAt",
        sort_order: req.query.sort_order as "asc" | "desc" || "asc",
      };

      const result = await this.productService.findAll(queryParams);
      sendSuccessResponse(res, result);
    } catch (error) {
      logger.error("Error retrieving products:", error);
      next(error);
    }
  }

  /**
   * Get products by farmer ID
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getFarmerProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.params.farmer_id;
      
      const queryParams: ProductQueryParams = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sort_by: "createdAt",
        sort_order: "asc",
      };

      // Assuming you have this method in your service
      const result = await this.productService.findByFarmerId(farmerId, queryParams);
      sendSuccessResponse(res, result);
    } catch (error) {
      logger.error("Error retrieving farmer products:", error);
      next(error);
    }
  }

  /**
   * Update a product
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.product_id;
      const farmerId = req.user?.userId;

      // Check if product exists
      const product = await this.productService.findById(productId);
      if (!product) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Product not found");
      }
      
      if (!farmerId) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Farmer ID is required");
      }
      
      const isOwner = await this.productService.belongsToFarmer(productId, farmerId);
      if (!isOwner) {
        throw new ApiError(
          HttpStatusCode.FORBIDDEN, 
          "You can only update your own products"
        );
      }

      // Update product
      const updateData: UpdateProductDto = req.body;
      const updatedProduct = await this.productService.update(productId, updateData);

      sendSuccessResponse(res, { product: updatedProduct });
    } catch (error) {
      logger.error("Error updating product:", error);
      next(error);
    }
  }

  /**
   * Delete a product
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.product_id;
      const farmerId = req.user?.userId;

      // Check if product exists
      const product = await this.productService.findById(productId);
      if (!product) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Product not found");
      }

      if (!farmerId) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Farmer ID is required");
      }
      
      // Check if product belongs to the authenticated farmer
      const isOwner = await this.productService.belongsToFarmer(productId, farmerId);
      if (!isOwner) {
        throw new ApiError(
          HttpStatusCode.FORBIDDEN, 
          "You can only delete your own products"
        );
      }

      // Delete product (soft delete)
      await this.productService.delete(productId);

      sendSuccessResponse(res, null, HttpStatusCode.NO_CONTENT);
    } catch (error) {
      logger.error("Error deleting product:", error);
      next(error);
    }
  }

  /**
   * Get product inventory status
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getProductInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.product_id;
      // Assuming you have this method in your service
      const inventoryStatus = await this.productService.getInventoryStatus(productId);
      
      sendSuccessResponse(res, { inventoryStatus });
    } catch (error) {
      logger.error("Error retrieving product inventory:", error);
      next(error);
    }
  }
}