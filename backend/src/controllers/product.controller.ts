import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { CreateProductDto, UpdateProductDto, ProductQueryParams, ProductResponse } from "../schemas/product.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";
import { hasRequiredCertifications, getCertificationsCount } from "../utils/certificateValidator";
import { NotificationService } from "../utils/notification.service";
import { ProductHistoryController, ChangeType } from "./productHistory.controller";
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

      // Registrar la creación en el historial
      try {
        await ProductHistoryController.recordChange({
          productId: newProduct.id,
          userId: req.user!.userId,
          changeType: ChangeType.CREATE,
          additionalInfo: {
            productData: {
              name: productData.name,
              description: productData.description,
              basePrice: productData.basePrice,
              stockQuantity: productData.stockQuantity,
              unitMeasure: productData.unitMeasure || "kg",
              categoryId: productData.categoryId,
              originLocationId: productData.originLocationId
            }
          }
        });
      } catch (historyError) {
        console.error('[ProductController.createProduct] Error recording history:', historyError);
        // No detenemos la creación del producto si falla el registro de historial
      }

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
      
      // Create notification
      try {
        await NotificationService.notifyProductCreated(
          productData.sellerId, 
          newProduct.id, 
          productData.name
        );
        console.log(`[ProductController.createProduct] Notification sent for product creation: ${newProduct.id}`);
      } catch (notificationError) {
        console.error('[ProductController.createProduct] Error creating notification:', notificationError);
        // Continue with product creation even if notification fails
      }
      
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

      // Parse sortBy parameter to handle formatted sort options
      let orderByField: string = "createdAt";
      let orderByDirection: "asc" | "desc" = "desc";

      if (sortBy) {
        const sortByString = sortBy as string;
        if (sortByString === "price_asc") {
          orderByField = "basePrice";
          orderByDirection = "asc";
        } else if (sortByString === "price_desc") {
          orderByField = "basePrice";
          orderByDirection = "desc";
        } else if (sortByString === "name_asc") {
          orderByField = "name";
          orderByDirection = "asc";
        } else if (sortByString === "name_desc") {
          orderByField = "name";
          orderByDirection = "desc";
        } else if (sortByString.includes("_")) {
          // Handle any other field_direction format
          const [field, direction] = sortByString.split("_");
          orderByField = field === "price" ? "basePrice" : field;
          orderByDirection = direction === "asc" ? "asc" : "desc";
        } else {
          // Use the sortBy directly if it's not in field_direction format
          orderByField = sortByString;
          orderByDirection = sortOrder === "asc" ? "asc" : "desc";
        }
      }

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
          orderBy: { [orderByField]: orderByDirection },
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
      const { productId } = req.params;
      const updateData: UpdateProductDto = req.body;

      // First, fetch the product to check owner and get current values
      const existingProduct = await this.db.product.findUnique({
        where: { id: productId },
        include: {
          seller: true,
          images: true
        }
      });

      if (!existingProduct) {
        sendNotFoundResponse(res, 'Product not found');
        return;
      }

      // Check if user can update this product (must be seller or admin)
      if (!req.user || (req.user.userType !== "ADMIN" && req.user.userId !== existingProduct.sellerId)) {
        sendErrorResponse(res, "You do not have permission to update this product", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Get original product for comparison
      const originalProduct = await this.db.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          originLocation: true
        }
      });

      if (!originalProduct) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Prepare the data for update
      const dataToUpdate: any = {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.basePrice !== undefined && { basePrice: updateData.basePrice }),
        ...(updateData.stockQuantity !== undefined && { stockQuantity: updateData.stockQuantity }),
        ...(updateData.unitMeasure !== undefined && { unitMeasure: updateData.unitMeasure }),
        ...(updateData.isFeatured !== undefined && { isFeatured: updateData.isFeatured }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.categoryId !== undefined && { 
          category: updateData.categoryId ? { connect: { id: updateData.categoryId } } : { disconnect: true }
        }),
        ...(updateData.originLocationId !== undefined && { 
          originLocation: updateData.originLocationId ? 
            { connect: { id: updateData.originLocationId } } : 
            { disconnect: true }
        }),
        updatedAt: new Date()
      };

      // Check if stock quantity is being updated to a low level
      const LOW_STOCK_THRESHOLD = 10;
      if (updateData.stockQuantity !== undefined && 
          updateData.stockQuantity <= LOW_STOCK_THRESHOLD && 
          (existingProduct.stockQuantity === undefined || existingProduct.stockQuantity > LOW_STOCK_THRESHOLD)) {
        // Send low stock notification
        try {
          await NotificationService.notifyLowStock(
            existingProduct.sellerId,
            existingProduct.id,
            existingProduct.name,
            updateData.stockQuantity
          );
          console.log(`[ProductController.updateProduct] Low stock notification sent for product: ${existingProduct.id}`);
        } catch (notificationError) {
          console.error('[ProductController.updateProduct] Error sending low stock notification:', notificationError);
          // Continue with product update even if notification fails
        }
      }

      // Update the product
      const updatedProduct = await this.db.product.update({
        where: { id: productId },
        data: dataToUpdate,
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
        }
      });
      
      // Registrar los cambios en el historial
      try {
        // Procesamiento de los cambios detectados
        const changesDetected = [];
        
        // Comparar propiedades simples
        const fieldComparisons = [
          { field: 'name', oldValue: originalProduct.name, newValue: updatedProduct.name },
          { field: 'description', oldValue: originalProduct.description, newValue: updatedProduct.description },
          { field: 'basePrice', oldValue: originalProduct.basePrice, newValue: updatedProduct.basePrice },
          { field: 'stockQuantity', oldValue: originalProduct.stockQuantity, newValue: updatedProduct.stockQuantity },
          { field: 'unitMeasure', oldValue: originalProduct.unitMeasure, newValue: updatedProduct.unitMeasure },
          { field: 'isFeatured', oldValue: originalProduct.isFeatured, newValue: updatedProduct.isFeatured },
          { field: 'isActive', oldValue: originalProduct.isActive, newValue: updatedProduct.isActive },
        ];
        
        // Registrar cada cambio individualmente
        for (const comparison of fieldComparisons) {
          if (comparison.oldValue !== comparison.newValue && updateData[comparison.field] !== undefined) {
            changesDetected.push(comparison);
            await ProductHistoryController.recordChange({
              productId: productId,
              userId: req.user!.userId,
              changeType: ChangeType.UPDATE,
              changeField: comparison.field,
              oldValue: String(comparison.oldValue),
              newValue: String(comparison.newValue)
            });
          }
        }
        
        // Comparar relaciones
        if (updateData.categoryId !== undefined && originalProduct.categoryId !== updateData.categoryId) {
          await ProductHistoryController.recordChange({
            productId: productId,
            userId: req.user!.userId,
            changeType: ChangeType.UPDATE,
            changeField: 'categoryId',
            oldValue: originalProduct.categoryId || 'none',
            newValue: updateData.categoryId || 'none'
          });
          changesDetected.push({ field: 'categoryId', oldValue: originalProduct.categoryId, newValue: updateData.categoryId });
        }
        
        if (updateData.originLocationId !== undefined && originalProduct.originLocationId !== updateData.originLocationId) {
          await ProductHistoryController.recordChange({
            productId: productId,
            userId: req.user!.userId,
            changeType: ChangeType.UPDATE,
            changeField: 'originLocationId',
            oldValue: originalProduct.originLocationId || 'none',
            newValue: updateData.originLocationId || 'none'
          });
          changesDetected.push({ field: 'originLocationId', oldValue: originalProduct.originLocationId, newValue: updateData.originLocationId });
        }
        
        console.log(`[ProductController.updateProduct] Recorded ${changesDetected.length} changes in history`);
      } catch (historyError) {
        console.error('[ProductController.updateProduct] Error recording history:', historyError);
        // No detenemos la actualización del producto si falla el registro de historial
      }

      // Handle image updates if images were uploaded
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`[ProductController.updateProduct] Processing ${req.files.length} new images`);
        
        // If deleteImages flag is set, delete existing images
        if (updateData.deleteExistingImages) {
          console.log(`[ProductController.updateProduct] Deleting existing images for product ${productId}`);
          
          try {
            // Get existing images
            const existingImages = await this.db.productImage.findMany({
              where: { productId: productId }
            });
            
            // Delete image files from storage
            for (const image of existingImages) {
              try {
                const imagePath = image.imageUrl.split('/').pop();
                if (imagePath) {
                  const fullPath = path.join(__dirname, '../../../uploads/products', imagePath);
                  if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`[ProductController.updateProduct] Deleted image file: ${fullPath}`);
                  }
                }
              } catch (fileErr) {
                console.error(`[ProductController.updateProduct] Error deleting image file:`, fileErr);
                // Continue even if file deletion fails
              }
            }
            
            // Delete image records from database
            await this.db.productImage.deleteMany({
              where: { productId: productId }
            });
            
            console.log(`[ProductController.updateProduct] Successfully deleted existing images`);
          } catch (deleteErr) {
            console.error(`[ProductController.updateProduct] Error deleting existing images:`, deleteErr);
            // Continue with product update even if image deletion fails
          }
        }
        
        // Process new images
        try {
          const uploadDir = path.join(__dirname, '../../../uploads/products');
          const imageRecordsData = (req.files as Express.Multer.File[]).map((file, index) => {
            const protocol = req.protocol;
            const host = req.get('host') || 'localhost:3001';
            const fileUrl = `${protocol}://${host}/uploads/products/${file.filename}`;
            
            return {
              productId: productId,
              imageUrl: fileUrl,
              altText: updatedProduct.name,
              isPrimary: updateData.deleteExistingImages ? index === 0 : false,
              displayOrder: index,
            };
          });
          
          // Use a transaction to ensure all images are created or none
          await this.db.$transaction(async (tx) => {
            for (const imageRecord of imageRecordsData) {
              await tx.productImage.create({
                data: imageRecord
              });
            }
          });
          
          console.log(`[ProductController.updateProduct] Successfully added ${imageRecordsData.length} new images`);
        } catch (imgError) {
          console.error('[ProductController.updateProduct] Error processing images:', imgError);
          // Continue with product update even if image processing fails
        }
      }
      
      // Refetch product with updated images
      const finalProduct = await this.db.product.findUnique({
        where: { id: productId },
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
        }
      });
      
      if (!finalProduct) {
        sendErrorResponse(res, 'Failed to retrieve updated product', HttpStatusCode.INTERNAL_SERVER_ERROR);
        return;
      }

      const productResponse = this.mapToProductResponse(finalProduct);
      sendSuccessResponse(res, productResponse);
    } catch (error) {
      console.error("Error updating product:", error);
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

      // Get product to delete for recording history
      const productToDelete = await this.db.product.findUnique({
        where: { id: productId },
        include: {
          images: true
        }
      });

      if (!productToDelete) {
        sendNotFoundResponse(res, "Product not found");
        return;
      }

      // Delete the product
      await this.db.product.delete({
        where: { id: productId },
      });

      // Registrar la eliminación en el historial
      try {
        await ProductHistoryController.recordChange({
          productId,
          userId: req.user!.userId,
          changeType: ChangeType.DELETE,
          additionalInfo: {
            deletedProduct: {
              name: productToDelete.name,
              description: productToDelete.description,
              basePrice: productToDelete.basePrice,
              stockQuantity: productToDelete.stockQuantity,
              unitMeasure: productToDelete.unitMeasure
            }
          }
        });
      } catch (historyError) {
        console.error('[ProductController.deleteProduct] Error recording history:', historyError);
        // No revertimos la eliminación si falla el registro de historial
      }

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
      price: product.basePrice,
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
