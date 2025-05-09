import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateProductDto, UpdateProductDto, ProductQueryParams } from "../schemas/product.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";

const prisma = new PrismaClient();

export class ProductController {
  /**
   * Create a new product
   * @param req Express request
   * @param res Express response
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData: CreateProductDto = req.body;

      // Set seller ID from authenticated user if not provided
      if (!productData.sellerId && req.user?.userId) {
        productData.sellerId = req.user.userId;
      }

      // Ensure only sellers and admins can create products
      if (!req.user || (req.user.userType !== "SELLER" && req.user.userType !== "ADMIN")) {
        sendErrorResponse(res, "Only sellers can create products", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Ensure user can only create products for themselves unless they're an admin
      if (req.user.userType !== "ADMIN" && productData.sellerId !== req.user.userId) {
        sendErrorResponse(res, "You can only create products for yourself", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Create the product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          basePrice: productData.basePrice,
          stockQuantity: productData.stockQuantity,
          unitMeasure: productData.unitMeasure || "kg",
          productTypeId: productData.productTypeId,
          sellerId: productData.sellerId,
          originLocationId: productData.originLocationId,
          isFeatured: productData.isFeatured || false,
        },
        include: {
          productType: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Map product to response object
      const productResponse = this.mapToProductResponse(product);
      sendSuccessResponse(res, productResponse, HttpStatusCode.CREATED);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a product by ID
   * @param req Express request
   * @param res Express response
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId;
      
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          productType: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          originLocation: true,
          images: true,
        },
      });

      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Map product to response object
      const productResponse = this.mapToProductResponse(product);
      sendSuccessResponse(res, productResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all products with filtering and pagination
   * @param req Express request
   * @param res Express response
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const queryParams: ProductQueryParams = {
        productTypeId: req.query.productTypeId as string,
        sellerId: req.query.sellerId as string,
        search: req.query.search as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        isFeatured: req.query.isFeatured === "true" ? true : req.query.isFeatured === "false" ? false : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
      };

      const {
        productTypeId,
        sellerId,
        search,
        minPrice,
        maxPrice,
        isFeatured,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { isActive: true };

      if (productTypeId) {
        where.productTypeId = productTypeId;
      }

      if (sellerId) {
        where.sellerId = sellerId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
      }

      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get products and total count
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            productType: true,
            seller: {
              select: {
                id: true,
                username: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      sendSuccessResponse(res, {
        products: products.map(this.mapToProductResponse),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a product
   * @param req Express request
   * @param res Express response
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId;
      const updateData: UpdateProductDto = req.body;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      
      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Check if user has permission to update this product
      if (req.user?.userType !== "ADMIN" && product.sellerId !== req.user?.userId) {
        sendErrorResponse(res, "You can only update your own products", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Prepare update data
      const updateDataForPrisma: any = {};

      if (updateData.name !== undefined) updateDataForPrisma.name = updateData.name;
      if (updateData.description !== undefined) updateDataForPrisma.description = updateData.description;
      if (updateData.basePrice !== undefined) updateDataForPrisma.basePrice = updateData.basePrice;
      if (updateData.stockQuantity !== undefined) updateDataForPrisma.stockQuantity = updateData.stockQuantity;
      if (updateData.unitMeasure !== undefined) updateDataForPrisma.unitMeasure = updateData.unitMeasure;
      if (updateData.productTypeId !== undefined) updateDataForPrisma.productTypeId = updateData.productTypeId;
      if (updateData.originLocationId !== undefined) updateDataForPrisma.originLocationId = updateData.originLocationId;
      if (updateData.isFeatured !== undefined) updateDataForPrisma.isFeatured = updateData.isFeatured;

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateDataForPrisma,
        include: {
          productType: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          originLocation: true,
          images: true,
        },
      });

      // Map product to response object
      const productResponse = this.mapToProductResponse(updatedProduct);
      sendSuccessResponse(res, productResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a product
   * @param req Express request
   * @param res Express response
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.params.productId;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      
      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Check if user has permission to delete this product
      if (req.user?.userType !== "ADMIN" && product.sellerId !== req.user?.userId) {
        sendErrorResponse(res, "You can only delete your own products", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Soft delete product
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });

      sendSuccessResponse(res, { message: "Product deleted successfully" }, HttpStatusCode.OK);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get featured products
   * @param req Express request
   * @param res Express response
   */
  async getFeaturedProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 6;
      
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          productType: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      });

      sendSuccessResponse(res, { 
        products: products.map(this.mapToProductResponse) 
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Map product entity to product response
   * @param product Product entity
   * @returns Product response
   */
  private mapToProductResponse(product: any): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      stockQuantity: product.stockQuantity,
      unitMeasure: product.unitMeasure,
      sellerId: product.sellerId,
      productTypeId: product.productTypeId,
      originLocationId: product.originLocationId,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: product.images?.map((image: any) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
      })),
      seller: product.seller
        ? {
            id: product.seller.id,
            username: product.seller.username,
          }
        : undefined,
      productType: product.productType
        ? {
            id: product.productType.id,
            name: product.productType.name,
          }
        : undefined,
    };
  }
} 