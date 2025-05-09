import { z } from "zod";

// Base schema for product validation
export const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  basePrice: z.number().positive("Price must be a positive number"),
  stockQuantity: z.number().int().positive("Quantity must be a positive integer"),
  unitMeasure: z.string().default("kg"),
  productTypeId: z.string().optional(),
  originLocationId: z.string().min(1, { message: "Location ID is required" }),
  sellerId: z.string().min(1, { message: "Seller ID is required" }),
  isFeatured: z.boolean().optional().default(false),
});

// Schema for creating a product
export const createProductSchema = productSchema;

// Schema for updating a product - all fields are optional
export const updateProductSchema = productSchema.partial();

// Schema for product query parameters
export const productQuerySchema = z.object({
  productTypeId: z.string().optional(),
  sellerId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt", "basePrice", "name"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;

// Product response type
export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  stockQuantity: number;
  unitMeasure: string;
  sellerId: string;
  productTypeId?: string;
  originLocationId: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  images?: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }>;
  seller?: {
    id: string;
    username: string;
  };
  productType?: {
    id: string;
    name: string;
  };
} 