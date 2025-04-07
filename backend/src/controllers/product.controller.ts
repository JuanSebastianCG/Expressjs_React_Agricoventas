import type { Request, Response } from "express"
import { ProductService } from "../services/product.service"
import type { CreateProductDto, UpdateProductDto, ProductQueryParams } from "../schemas/product.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler"

export class ProductController {
  private productService: ProductService

  constructor() {
    this.productService = new ProductService()
  }

  /**
   * Create a new product
   * @param req - Express request
   * @param res - Express response
   */
  async createProduct(req: Request, res: Response) {
    try {
      const productData: CreateProductDto = req.body

      // Verify that the farmer_id matches the authenticated user
      if (req.user && req.user.userId !== productData.farmer_id) {
        return sendErrorResponse(
          res,
          "You can only create products for yourself",
          HttpStatusCode.FORBIDDEN,
          "FORBIDDEN",
        )
      }

      const product = await this.productService.create(productData)

      return sendSuccessResponse(res, product, HttpStatusCode.CREATED)
    } catch (error) {
      console.error("Error creating product:", error)
      return sendErrorResponse(res, "Failed to create product", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get a product by ID
   * @param req - Express request
   * @param res - Express response
   */
  async getProductById(req: Request, res: Response) {
    try {
      const productId = req.params.product_id
      const product = await this.productService.findById(productId)

      if (!product) {
        return sendNotFoundResponse(res, "Product not found")
      }

      return sendSuccessResponse(res, product)
    } catch (error) {
      console.error("Error retrieving product:", error)
      return sendErrorResponse(res, "Failed to retrieve product", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get products with filtering and pagination
   * @param req - Express request
   * @param res - Express response
   */
  async getProducts(req: Request, res: Response) {
    try {
      const queryParams: ProductQueryParams = {
        category: req.query.category as string,
        search: req.query.search as string,
        min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
        max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
        availability_date: req.query.availability_date as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      }

      const result = await this.productService.findAll(queryParams)

      return sendSuccessResponse(res, result)
    } catch (error) {
      console.error("Error retrieving products:", error)
      return sendErrorResponse(res, "Failed to retrieve products", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Update a product
   * @param req - Express request
   * @param res - Express response
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const productId = req.params.product_id
      const farmerId = req.user?.userId

      // Check if product exists
      const product = await this.productService.findById(productId)
      if (!product) {
        return sendNotFoundResponse(res, "Product not found")
      }
      if (!farmerId) {
        return sendErrorResponse(res, "Farmer ID is required", HttpStatusCode.BAD_REQUEST, "BAD_REQUEST")
      }
      
      const isOwner = await this.productService.belongsToFarmer(productId, farmerId)
      if (!isOwner) {
        return sendErrorResponse(res, "You can only update your own products", HttpStatusCode.FORBIDDEN, "FORBIDDEN")
      }

      // Update product
      const updateData: UpdateProductDto = req.body
      const updatedProduct = await this.productService.update(productId, updateData)

      return sendSuccessResponse(res, updatedProduct)
    } catch (error) {
      console.error("Error updating product:", error)
      return sendErrorResponse(res, "Failed to update product", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Delete a product
   * @param req - Express request
   * @param res - Express response
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const productId = req.params.product_id
      const farmerId = req.user?.userId

      // Check if product exists
      const product = await this.productService.findById(productId)
      if (!product) {
        return sendNotFoundResponse(res, "Product not found")
      }

      if (!farmerId) {
        return sendErrorResponse(res, "Farmer ID is required", HttpStatusCode.BAD_REQUEST, "BAD_REQUEST")
      }
      // Check if product belongs to the authenticated farmer
      const isOwner = await this.productService.belongsToFarmer(productId, farmerId)
      if (!isOwner) {
        return sendErrorResponse(res, "You can only delete your own products", HttpStatusCode.FORBIDDEN, "FORBIDDEN")
      }

      // Delete product (soft delete)
      await this.productService.delete(productId)

      return sendSuccessResponse(res, null, HttpStatusCode.NO_CONTENT)
    } catch (error) {
      console.error("Error deleting product:", error)
      return sendErrorResponse(res, "Failed to delete product", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }
}

