import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { CreateProductDto, UpdateProductDto, ProductQueryParams, ProductResponse } from "../schemas/product.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import { hasRequiredCertifications, getCertificationsCount } from "../utils/certificateValidator";

const prisma = new PrismaClient();

export class ProductController {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

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

      // Check if user has all required certifications
      const userId = productData.sellerId;
      const hasAllCertifications = await hasRequiredCertifications(userId);
      
      if (!hasAllCertifications) {
        // Get certification count to provide more detailed error
        const certCount = await getCertificationsCount(userId);
        sendErrorResponse(
          res, 
          `Cannot create product. You need all 4 verified Colombian certifications. Currently you have ${certCount.verified}/${certCount.total} verified.`, 
          HttpStatusCode.FORBIDDEN
        );
        return;
      }

      // Create the product
      const product = await this.db.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          basePrice: productData.basePrice,
          stockQuantity: productData.stockQuantity,
          unitMeasure: productData.unitMeasure || "kg",
          categoryId: productData.categoryId,
          sellerId: productData.sellerId,
          originLocationId: productData.originLocationId,
          isFeatured: productData.isFeatured || false,
          isActive: productData.isActive || true,
        } as any,
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          originLocation: true,
          images: true,
        } as any,
      });

      // Map product to response object
      const productResponse = this.mapToProductResponse(product);
      sendSuccessResponse(res, productResponse, HttpStatusCode.CREATED);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        sendErrorResponse(res, 'Product with this name already exists for the seller.', HttpStatusCode.CONFLICT);
      } else {
        console.error("Error creating product:", error);
        sendErrorResponse(res, 'Failed to create product', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
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
      
      const product = await this.db.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          originLocation: true,
          images: true,
          reviews: true,
        } as any,
      });

      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Map product to response object
      const productResponse = this.mapToProductResponse(product);
      sendSuccessResponse(res, productResponse);
    } catch (error: any) {
      const productIdForError = req.params.productId;
      console.error(`Error fetching product ${productIdForError}:`, error);
      sendErrorResponse(res, 'Failed to fetch product', HttpStatusCode.INTERNAL_SERVER_ERROR);
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
        categoryId: req.query.categoryId as string,
        sellerId: req.query.sellerId as string,
        search: req.query.search as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        isFeatured: req.query.isFeatured === "true" ? true : req.query.isFeatured === "false" ? false : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
        originLocationId: req.query.originLocationId as string,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      };

      const {
        categoryId,
        sellerId,
        search,
        minPrice,
        maxPrice,
        isFeatured,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        originLocationId,
        isActive,
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { isActive: isActive === undefined ? true : isActive };

      if (categoryId) {
        where.categoryId = categoryId;
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

      if (originLocationId) {
        where.originLocationId = originLocationId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get products and total count
      const [products, total] = await Promise.all([
        this.db.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: true,
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
            reviews: {
              select: { rating: true },
            },
          } as any,
        }),
        this.db.product.count({ where }),
      ]);

      const responseProducts = products.map(this.mapToProductResponse);

      sendSuccessResponse(res, {
        products: responseProducts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      sendErrorResponse(res, 'Failed to fetch products', HttpStatusCode.INTERNAL_SERVER_ERROR);
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
      const product = await this.db.product.findUnique({
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
      if (updateData.categoryId !== undefined) updateDataForPrisma.categoryId = updateData.categoryId;
      if (updateData.originLocationId !== undefined) updateDataForPrisma.originLocationId = updateData.originLocationId;
      if (updateData.isFeatured !== undefined) updateDataForPrisma.isFeatured = updateData.isFeatured;
      if (updateData.isActive !== undefined) updateDataForPrisma.isActive = updateData.isActive;

      // Update product
      const updatedProduct = await this.db.product.update({
        where: { id: productId },
        data: updateDataForPrisma as any,
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          originLocation: true,
          images: true,
        } as any,
      });

      // Map product to response object
      const productResponse = this.mapToProductResponse(updatedProduct);
      sendSuccessResponse(res, productResponse);
    } catch (error: any) {
      const productIdForError = req.params.productId;
      console.error(`Error updating product ${productIdForError}:`, error);
      sendErrorResponse(res, 'Failed to update product', HttpStatusCode.INTERNAL_SERVER_ERROR);
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
      const product = await this.db.product.findUnique({
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
      await this.db.product.update({
        where: { id: productId },
        data: { isActive: false },
      });

      sendSuccessResponse(res, { message: "Product deleted successfully" }, HttpStatusCode.OK);
    } catch (error: any) {
      const productIdForError = req.params.productId;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        sendErrorResponse(res, 'Product not found', HttpStatusCode.NOT_FOUND);
      } else {
        console.error(`Error deleting product ${productIdForError}:`, error);
        sendErrorResponse(res, 'Failed to delete product', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
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
      
      const products = await this.db.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
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
        } as any,
      });

      sendSuccessResponse(res, { 
        products: products.map(this.mapToProductResponse) 
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all products for a specific user (seller)
   * @param req Express request
   * @param res Express response
   */
  async getUserProducts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query as any;
      const skip = (Number(page) - 1) * Number(limit);

      const where: Prisma.ProductWhereInput = {
        sellerId: userId,
        isActive: true,
      };

      const [products, total] = await Promise.all([
        this.db.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder as string },
          include: {
            category: true,
            seller: { select: { id: true, username: true } },
            images: { where: { isPrimary: true }, take: 1 },
            reviews: { select: { rating: true } },
          } as any, // Prisma type workaround
        }),
        this.db.product.count({ where }),
      ]);

      const responseProducts = products.map(this.mapToProductResponse);
      sendSuccessResponse(res, {
        products: responseProducts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(`Error fetching products for user ${req.params.userId}:`, error);
      sendErrorResponse(res, 'Failed to fetch user products', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all products for a specific category
   * @param req Express request
   * @param res Express response
   */
  async getCategoryProducts(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query as any;
      const skip = (Number(page) - 1) * Number(limit);

      const where: Prisma.ProductWhereInput = {
        categoryId: categoryId,
        isActive: true,
      } as any; // Prisma type workaround for where clause

      const [products, total] = await Promise.all([
        this.db.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder as string },
          include: {
            category: true,
            seller: { select: { id: true, username: true } },
            images: { where: { isPrimary: true }, take: 1 },
            reviews: { select: { rating: true } },
          } as any, // Prisma type workaround
        }),
        this.db.product.count({ where }),
      ]);

      const responseProducts = products.map(this.mapToProductResponse);
      sendSuccessResponse(res, {
        products: responseProducts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(`Error fetching products for category ${req.params.categoryId}:`, error);
      sendErrorResponse(res, 'Failed to fetch category products', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Map product entity to product response
   * @param product Product entity
   * @returns Product response
   */
  private mapToProductResponse(product: any): ProductResponse {
    const averageRating = product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / product.reviews.length
      : null;
    const reviewCount = product.reviews ? product.reviews.length : 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      stockQuantity: product.stockQuantity,
      unitMeasure: product.unitMeasure,
      sellerId: product.sellerId,
      categoryId: product.categoryId,
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
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description,
            parentId: product.category.parentId,
            createdAt: product.category.createdAt,
            updatedAt: product.category.updatedAt,
          }
        : undefined,
      originLocation: product.originLocation,
      averageRating: averageRating,
      reviewCount: reviewCount,
    };
  }
} 
