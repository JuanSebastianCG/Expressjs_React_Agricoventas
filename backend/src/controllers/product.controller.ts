import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { CreateProductDto, UpdateProductDto, ProductQueryParams, ProductResponse } from "../schemas/product.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import { hasRequiredCertifications, getCertificationsCount } from "../utils/certificateValidator";
import path from "path";
import fs from "fs";

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
    console.log('[ProductController.createProduct] Received request to create product.');
    console.log('[ProductController.createProduct] req.headers[content-type]:', req.headers['content-type']);
    console.log('[ProductController.createProduct] START req.body:', JSON.stringify(req.body, null, 2));
    console.log('[ProductController.createProduct] START req.files:', req.files);

    try {
      const productData: CreateProductDto = req.body;

      // Set seller ID from authenticated user if not provided
      if (!productData.sellerId && req.user?.userId) {
        productData.sellerId = req.user.userId;
      }

      // Ensure only sellers and admins can create products
      if (!req.user || (req.user.userType !== "SELLER" && req.user.userType !== "ADMIN")) {
        sendErrorResponse(res, "Only sellers or admins can create products", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Ensure user can only create products for themselves unless they're an admin
      if (req.user.userType !== "ADMIN" && productData.sellerId !== req.user.userId) {
        sendErrorResponse(res, "You can only create products for yourself", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Check if user has all required certifications (if not an admin)
      if (req.user.userType !== "ADMIN") {
      const userId = productData.sellerId;
      const hasAllCertifications = await hasRequiredCertifications(userId);
      
      if (!hasAllCertifications) {
        const certCount = await getCertificationsCount(userId);
        sendErrorResponse(
          res, 
          `Cannot create product. You need all 4 verified Colombian certifications. Currently you have ${certCount.verified}/${certCount.total} verified.`, 
          HttpStatusCode.FORBIDDEN
        );
        return;
        }
      }

      // Create the product
      const newProduct = await this.db.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          basePrice: productData.basePrice,
          stockQuantity: productData.stockQuantity,
          unitMeasure: productData.unitMeasure || "kg",
          isFeatured: productData.isFeatured || false,
          isActive: productData.isActive === undefined ? true : productData.isActive,
          ...(productData.sellerId && { seller: { connect: { id: productData.sellerId } } }),
          ...(productData.categoryId && { category: { connect: { id: productData.categoryId } } }),
          ...(productData.originLocationId && { originLocation: { connect: { id: productData.originLocationId } } }),
        } as any,
      });

      // Process and link uploaded images
      console.log('[ProductController.createProduct] Files in request:', req.files);
      
      // Debug the entire request object to see what's coming in
      console.log('[ProductController.createProduct] Request content-type:', req.headers['content-type']);
      console.log('[ProductController.createProduct] Request body keys:', Object.keys(req.body));
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.log('[ProductController.createProduct] No files uploaded or files not in expected format');
      } else {
        console.log(`[ProductController.createProduct] Detected ${req.files.length} image(s) to process`);
        
        // Create directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../../../uploads/products');
        if (!fs.existsSync(uploadDir)) {
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[ProductController.createProduct] Created uploads directory: ${uploadDir}`);
          } catch (dirErr) {
            console.error(`[ProductController.createProduct] Failed to create directory: ${uploadDir}`, dirErr);
          }
        }
        
        try {
          // Prepare image records
          const imageRecordsData = (req.files as Express.Multer.File[]).map((file, index) => {
            // Get the protocol (http or https) and host from request
            const protocol = req.protocol;
            const host = req.get('host') || 'localhost:3001';
            
            // Make sure the URL is correctly formatted
            const fileUrl = `${protocol}://${host}/uploads/products/${file.filename}`;
            
            console.log(`[ProductController.createProduct] Creating image record for ${file.filename}`);
            console.log(`[ProductController.createProduct] Generated URL: ${fileUrl}`);
            console.log(`[ProductController.createProduct] File details:`, {
              fieldname: file.fieldname,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
              filename: file.filename
            });
            
            // Check if file physically exists
            const filePath = path.join(uploadDir, file.filename);
            const fileExists = fs.existsSync(filePath);
            console.log(`[ProductController.createProduct] File exists at ${filePath}: ${fileExists}`);
            
            // Check if file is accessible
            try {
              fs.accessSync(filePath, fs.constants.R_OK);
              console.log(`[ProductController.createProduct] File is readable: ${filePath}`);
            } catch (accessErr) {
              console.error(`[ProductController.createProduct] File access error: ${filePath}`, accessErr);
            }
            
            return {
              productId: newProduct.id,
              imageUrl: fileUrl,
              altText: productData.name,
              isPrimary: index === 0,
              displayOrder: index,
            };
          });
          
          // Proceed only if we have image records to create
          if (imageRecordsData.length > 0) {
            // Instead of createMany, use a transaction to ensure all images are created or none
            await this.db.$transaction(async (tx) => {
              for (const imageRecord of imageRecordsData) {
                await tx.productImage.create({
                  data: imageRecord
                });
                console.log(`[ProductController.createProduct] Created image record for product ${imageRecord.productId}`);
              }
            });
            
            console.log(`[ProductController.createProduct] Successfully created ${imageRecordsData.length} image records via transaction`);
          }
        } catch (imgError) {
          console.error('[ProductController.createProduct] Error processing images:', imgError);
          // Continue with product creation even if image processing fails
        }
      }

      // Refetch product with all relations to ensure response is complete
      const productForResponse = await this.db.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          originLocation: true,
          images: true,
        } as any,
      });

      if (!productForResponse) {
        // This case should ideally not be reached if product creation was successful
        sendErrorResponse(res, 'Failed to retrieve product after creation', HttpStatusCode.INTERNAL_SERVER_ERROR);
        return;
      }

      const productResponse = this.mapToProductResponse(productForResponse);
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
        city: req.query.city as string | undefined,
        department: req.query.department as string | undefined,
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
        city,
        department,
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
      } else {
        if (city || department) {
          where.originLocation = {};
          if (city) {
            where.originLocation.city = { contains: city, mode: "insensitive" };
          }
          if (department) {
            where.originLocation.department = { contains: department, mode: "insensitive" };
          }
        }
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
                firstName: true,
                lastName: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            reviews: {
              select: { rating: true },
            },
            originLocation: true,
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
      const { existingImages } = req.body; // Array of URLs of existing images to keep

      const product = await this.db.product.findUnique({
        where: { id: productId },
        include: { images: true }, // Include existing images
      });
      
      if (!product) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      if (req.user?.userType !== "ADMIN" && product.sellerId !== req.user?.userId) {
        sendErrorResponse(res, "You can only update your own products", HttpStatusCode.FORBIDDEN);
        return;
      }

      const updatePayload: Prisma.ProductUpdateInput = {};
      if (updateData.name !== undefined) updatePayload.name = updateData.name;
      if (updateData.description !== undefined) updatePayload.description = updateData.description;
      if (updateData.basePrice !== undefined) updatePayload.basePrice = updateData.basePrice;
      if (updateData.stockQuantity !== undefined) updatePayload.stockQuantity = updateData.stockQuantity;
      if (updateData.unitMeasure !== undefined) updatePayload.unitMeasure = updateData.unitMeasure;
      if (updateData.categoryId !== undefined) {
        updatePayload.category = { connect: { id: updateData.categoryId } };
      }
      if (updateData.originLocationId !== undefined) {
        updatePayload.originLocation = { connect: { id: updateData.originLocationId } };
      }
      if (updateData.isFeatured !== undefined) updatePayload.isFeatured = updateData.isFeatured;
      if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

      // Image update logic
      const imagesToDeleteDb: string[] = []; // IDs of ProductImage records to delete
      const filesToDeleteFs: string[] = [];  // File paths to delete from filesystem

      if (product.images) {
        product.images.forEach(existingImg => {
          if (!existingImages || !existingImages.includes(existingImg.imageUrl)) {
            imagesToDeleteDb.push(existingImg.id);
            // Extract filename from URL for deletion. Assumes URL structure like http://host/uploads/products/filename.ext
            try {
              const urlParts = existingImg.imageUrl.split('/');
              const filename = urlParts[urlParts.length - 1];
              if (filename) {
                filesToDeleteFs.push(path.join(__dirname, '../../../uploads/products', decodeURIComponent(filename)));
              }
            } catch (e) {
              console.error('Error parsing filename from image URL for deletion:', existingImg.imageUrl, e);
            }
          }
        });
      }
      
      const newImageRecordsData: Prisma.ProductImageCreateManyInput[] = [];
      let currentDisplayOrder = product.images ? product.images.filter(img => existingImages && existingImages.includes(img.imageUrl)).length : 0;

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Create directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../../../uploads/products');
        if (!fs.existsSync(uploadDir)) {
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[ProductController.updateProduct] Created uploads directory: ${uploadDir}`);
          } catch (dirErr) {
            console.error(`[ProductController.updateProduct] Failed to create directory: ${uploadDir}`, dirErr);
          }
        }
        
        // Get request protocol and host for URL generation
        const protocol = req.protocol;
        const host = req.get('host') || 'localhost:3001';
        
        (req.files as Express.Multer.File[]).forEach((file) => {
          // Create URL using request protocol and host
          const fileUrl = `${protocol}://${host}/uploads/products/${file.filename}`;
          
          console.log(`[ProductController.updateProduct] Creating image record for ${file.filename}`);
          console.log(`[ProductController.updateProduct] Generated URL: ${fileUrl}`);
          console.log(`[ProductController.updateProduct] File details:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            filename: file.filename
          });
          
          // Check if file physically exists
          const filePath = path.join(uploadDir, file.filename);
          const fileExists = fs.existsSync(filePath);
          console.log(`[ProductController.updateProduct] File exists at ${filePath}: ${fileExists}`);
          
          newImageRecordsData.push({
            productId: productId,
            imageUrl: fileUrl,
            altText: updateData.name || product.name,
            isPrimary: false, // Will handle primary image logic later
            displayOrder: currentDisplayOrder++,
          });
        });
      }

      // Transaction to update product, delete old images, create new images
      await this.db.$transaction(async (prismaTx) => {
        if (imagesToDeleteDb.length > 0) {
          await prismaTx.productImage.deleteMany({
            where: { id: { in: imagesToDeleteDb } },
          });
        }

        if (newImageRecordsData.length > 0) {
          try {
            await prismaTx.productImage.createMany({
              data: newImageRecordsData,
            });
            console.log('[ProductController.updateProduct] Successfully created new productImage records in transaction.');
          } catch (dbError) {
            console.error('[ProductController.updateProduct] Error creating new productImage records in transaction:', dbError);
            throw dbError;
          }
        }
        
        // Update the product itself
        const updatedProductMain = await prismaTx.product.update({
          where: { id: productId },
          data: updatePayload,
        });

        // Set primary image: if no existing images are primary, or no images left, make the first one primary.
        const remainingImages = await prismaTx.productImage.findMany({
          where: { productId: productId },
          orderBy: { displayOrder: 'asc' },
        });

        let hasPrimary = remainingImages.some(img => img.isPrimary);
        if (!hasPrimary && remainingImages.length > 0) {
          await prismaTx.productImage.update({
            where: { id: remainingImages[0].id },
            data: { isPrimary: true },
          });
          // Ensure other images are not primary
          if (remainingImages.length > 1) {
            await prismaTx.productImage.updateMany({
                where: { productId: productId, id: { not: remainingImages[0].id } },
                data: { isPrimary: false }
            });
          }
        } else if (hasPrimary && remainingImages.filter(img => img.isPrimary).length > 1) {
          // If somehow multiple primaries, keep only the first one by displayOrder
           const firstPrimary = remainingImages.filter(img => img.isPrimary).sort((a,b) => a.displayOrder - b.displayOrder)[0];
           await prismaTx.productImage.updateMany({
             where: { productId: productId, id: {not: firstPrimary.id} },
             data: {isPrimary: false}
           })
        } else if (remainingImages.length === 0 && product.images.length > 0 && newImageRecordsData.length === 0 && imagesToDeleteDb.length > 0){
             // All images were deleted, nothing to set as primary
        }

        // Delete files from filesystem after DB transaction succeeds
        filesToDeleteFs.forEach(filePath => {
          fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete image file ${filePath}:`, err);
            else console.log(`Successfully deleted image file ${filePath}`);
          });
        });
        return updatedProductMain; // Or the full product with relations if needed for response mapping
      });

      // Refetch product with all relations for the response
      const productForResponse = await this.db.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          seller: { select: { id: true, username: true, firstName: true, lastName: true } },
          originLocation: true,
          images: { orderBy: { displayOrder: 'asc' } },
        } as any,
      });

      if (!productForResponse) {
        sendErrorResponse(res, 'Failed to retrieve product after update', HttpStatusCode.INTERNAL_SERVER_ERROR);
        return;
      }
      
      const productResponseData = this.mapToProductResponse(productForResponse);
      sendSuccessResponse(res, productResponseData);
    } catch (error: any) {
      const productIdForError = req.params.productId;
      console.error(`Error updating product ${productIdForError}:`, error);
      // Check for specific Prisma errors if necessary, e.g., P2025 for record not found during update
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
   * Get all product images for a specific product
   * @param req Express request
   * @param res Express response
   */
  async getProductImagesByProductId(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      if (!productId) {
        sendErrorResponse(res, "Product ID is required", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const productImages = await this.db.productImage.findMany({
        where: { productId: productId },
        orderBy: { displayOrder: 'asc' },
      });

      if (!productImages) { // findMany returns [], so check length instead
        // This case might not be strictly necessary if an empty array is acceptable for no images.
        // sendNotFoundResponse(res, "No images found for this product"); 
        // return;
      }

      sendSuccessResponse(res, productImages);
    } catch (error: any) {
      console.error(`Error fetching product images for product ${req.params.productId}:`, error);
      sendErrorResponse(res, 'Failed to fetch product images', HttpStatusCode.INTERNAL_SERVER_ERROR);
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

    let regionString: string | undefined = undefined;
    if (product.originLocation) {
      const city = product.originLocation.city;
      const department = product.originLocation.department;
      if (city && department) {
        regionString = `${city}, ${department}`;
      } else if (city) {
        regionString = city;
      } else if (department) {
        regionString = department;
      }
    }

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
        altText: image.altText,
        isPrimary: image.isPrimary,
        displayOrder: image.displayOrder,
      })),
      seller: product.seller
        ? {
            id: product.seller.id,
            username: product.seller.username,
            firstName: product.seller.firstName,
            lastName: product.seller.lastName,
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
      region: regionString,
      averageRating: averageRating,
      reviewCount: reviewCount,
    };
  }
} 
