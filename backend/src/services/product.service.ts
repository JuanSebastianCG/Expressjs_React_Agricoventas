import { PrismaClient } from '@prisma/client';
import type { CreateProductDto, UpdateProductDto, ProductQueryParams } from "../schemas/product.schema";

// Initialize Prisma client directly, matching the pattern used in other services
const prisma = new PrismaClient();

export class ProductService {
  /**
   * Create a new product
   * @param data - Product data
   * @returns Created product
   */
  async create(data: CreateProductDto) {
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        photos: data.photos || [],
        category: data.category,
        availability_start_date: new Date(data.availability_start_date),
        availability_end_date: new Date(data.availability_end_date),
        farmer_id: data.farmer_id,
      },
    });
  }

  /**
   * Get a product by ID
   * @param id - Product ID
   * @returns Product if found, null otherwise
   */
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  /**
   * Get products with filtering and pagination
   * @param params - Query parameters
   * @returns Products and pagination info
   */
  async findAll(params: ProductQueryParams) {
    const { category, search, min_price, max_price, availability_date, page = 1, limit = 10 } = params;

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

    // Get products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
  }

  /**
   * Update a product
   * @param id - Product ID
   * @param data - Updates for the product
   * @returns Updated product
   */
  async update(id: string, data: UpdateProductDto) {
    const updateData: any = { ...data };

    // Convert date strings to Date objects
    if (data.availability_start_date) {
      updateData.availability_start_date = new Date(data.availability_start_date);
    }

    if (data.availability_end_date) {
      updateData.availability_end_date = new Date(data.availability_end_date);
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a product (soft delete)
   * @param id - Product ID
   * @returns Updated product
   */
  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete a product
   * @param id - Product ID
   * @returns Deleted product
   */
  async hardDelete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Check if a product belongs to a farmer
   * @param productId - Product ID
   * @param farmerId - Farmer ID
   * @returns True if product belongs to farmer, false otherwise
   */
  async belongsToFarmer(productId: string, farmerId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        farmer_id: farmerId,
      },
    });

    return !!product;
  }
}

