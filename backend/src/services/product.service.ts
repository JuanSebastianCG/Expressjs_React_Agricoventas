import { PrismaClient } from '@prisma/client';
import type { CreateProductDto, UpdateProductDto, ProductQueryParams } from "../schemas/product.schema";
import { ApiError } from '../middleware/error.middleware';
import HttpStatusCode from '../utils/HttpStatusCode';
import { logger } from '../config/logger';

// Initialize Prisma client
const prisma = new PrismaClient();

export class ProductService {
  /**
   * Create a new product
   * @param data - Product data
   * @returns Created product
   */
  async create(data: CreateProductDto) {
    try {
      // Validate category exists
      const categoryExists = await prisma.category.findUnique({
        where: { id: data.category }
      });
      
      if (!categoryExists) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Invalid category');
      }
      
      // Validate dates
      const startDate = new Date(data.availability_start_date);
      const endDate = new Date(data.availability_end_date);
      
      if (startDate >= endDate) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST, 
          'End date must be after start date'
        );
      }
      
      return prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          photos: data.photos || [],
          category: data.category,
          availability_start_date: startDate,
          availability_end_date: endDate,
          farmer_id: data.farmer_id,
        },
      });
    } catch (error) {
      logger.error('Error creating product:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to create product');
    }
  }

  /**
   * Get a product by ID with category information
   * @param id - Product ID
   * @returns Product with category details if found, null otherwise
   */
  async findById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      
      if (!product) return null;
      
      // Get category information
      const category = await prisma.category.findUnique({
        where: { id: product.category },
        select: { name: true, slug: true }
      });
      
      return {
        ...product,
        categoryDetails: category
      };
    } catch (error) {
      logger.error(`Error retrieving product ${id}:`, error);
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve product');
    }
  }

  /**
   * Get products with enhanced filtering, sorting and pagination
   * @param params - Query parameters
   * @returns Products and pagination info
   */
  async findAll(params: ProductQueryParams) {
    try {
      const { 
        category, 
        search, 
        min_price, 
        max_price, 
        availability_date, 
        page = 1, 
        limit = 10,
        sort_by = 'createdAt',
        sort_order = 'desc'
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { isActive: true };

      if (category) {
        where.category = category;
      }

      if (min_price !== undefined || max_price !== undefined) {
        where.price = {};
        if (min_price !== undefined) where.price.$gte = min_price;
        if (max_price !== undefined) where.price.$lte = max_price;
      }

      if (availability_date) {
        const date = new Date(availability_date);
        where.availability_start_date = { $lte: date };
        where.availability_end_date = { $gte: date };
      }

      if (search) {
        where.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }

      // Validate sort field
      const allowedSortFields = ['name', 'price', 'createdAt', 'quantity'];
      const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'createdAt';
      const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';

      // Get products and total count
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortField]: sortDirection },
        }),
        prisma.product.count({ where }),
      ]);

      // Get category details for all products
      const categoryIds = [...new Set(products.map(p => p.category))];
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true }
      });

      const categoryMap = categories.reduce((map, cat) => {
        map[cat.id] = cat;
        return map;
      }, {} as Record<string, any>);

      // Enhance products with category details
      const enhancedProducts = products.map(product => ({
        ...product,
        categoryDetails: categoryMap[product.category] || null
      }));

      return {
        products: enhancedProducts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error retrieving products:', error);
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve products');
    }
  }

  /**
   * Get products by farmer ID
   * @param farmerId - Farmer ID
   * @param params - Query parameters
   * @returns Products and pagination info
   */
  async findByFarmerId(farmerId: string, params: ProductQueryParams) {
    try {
      const { page = 1, limit = 10 } = params;
      const skip = (page - 1) * limit;

      const where = { 
        farmer_id: farmerId,
        isActive: true
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error retrieving products for farmer ${farmerId}:`, error);
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve farmer products');
    }
  }

  /**
   * Update a product with validation
   * @param id - Product ID
   * @param data - Updates for the product
   * @returns Updated product
   */
  async update(id: string, data: UpdateProductDto) {
    try {
      const updateData: any = { ...data };

      // Validate category if provided
      if (data.category) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: data.category }
        });
        
        if (!categoryExists) {
          throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Invalid category');
        }
      }

      // Validate dates if both are provided
      if (data.availability_start_date && data.availability_end_date) {
        const startDate = new Date(data.availability_start_date);
        const endDate = new Date(data.availability_end_date);
        
        if (startDate >= endDate) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST, 
            'End date must be after start date'
          );
        }
        
        updateData.availability_start_date = startDate;
        updateData.availability_end_date = endDate;
      } else if (data.availability_start_date) {
        // If only start date is provided, validate against existing end date
        const product = await prisma.product.findUnique({
          where: { id },
          select: { availability_end_date: true }
        });
        
        const startDate = new Date(data.availability_start_date);
        
        if (product && startDate >= product.availability_end_date) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST, 
            'Start date must be before existing end date'
          );
        }
        
        updateData.availability_start_date = startDate;
      } else if (data.availability_end_date) {
        // If only end date is provided, validate against existing start date
        const product = await prisma.product.findUnique({
          where: { id },
          select: { availability_start_date: true }
        });
        
        const endDate = new Date(data.availability_end_date);
        
        if (product && product.availability_start_date >= endDate) {
          throw new ApiError(
            HttpStatusCode.BAD_REQUEST, 
            'End date must be after existing start date'
          );
        }
        
        updateData.availability_end_date = endDate;
      }

      return prisma.product.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      logger.error(`Error updating product ${id}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to update product');
    }
  }

  /**
   * Delete a product (soft delete)
   * @param id - Product ID
   * @returns Updated product
   */
  async delete(id: string) {
    try {
      return prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error(`Error deleting product ${id}:`, error);
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to delete product');
    }
  }

  /**
   * Check if a product belongs to a farmer
   * @param productId - Product ID
   * @param farmerId - Farmer ID
   * @returns True if product belongs to farmer, false otherwise
   */
  async belongsToFarmer(productId: string, farmerId: string) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          farmer_id: farmerId,
        },
      });

      return !!product;
    } catch (error) {
      logger.error(`Error checking product ownership for ${productId}:`, error);
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to verify product ownership');
    }
  }
  
  /**
   * Get product inventory status
   * @param productId - Product ID
   * @returns Inventory status
   */
  async getInventoryStatus(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { quantity: true }
      });
      
      if (!product) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'Product not found');
      }
      
      let status = 'In Stock';
      if (product.quantity <= 0) {
        status = 'Out of Stock';
      } else if (product.quantity < 10) {
        status = 'Low Stock';
      }
      
      return {
        productId,
        quantity: product.quantity,
        status
      };
    } catch (error) {
      logger.error(`Error getting inventory status for ${productId}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to get inventory status');
    }
  }
}