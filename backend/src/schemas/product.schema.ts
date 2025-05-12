import { z } from "zod"

// Base schema for product validation
export const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" })
    .max(100, { message: "Product name must be at most 100 characters" }),
  description: z.string().max(2000, { message: "Description must be at most 2000 characters" }).optional(),
  price: z.number()
    .positive("Price must be a positive number")
    .refine(val => val <= 10000, { message: "Price cannot exceed 10,000" }),
  quantity: z.number().int()
    .positive("Quantity must be a positive integer")
    .refine(val => val <= 10000, { message: "Quantity cannot exceed 10,000" }),
  photos: z.array(z.string().url("Invalid photo URL"))
    .max(10, { message: "Maximum 10 photos allowed" })
    .optional()
    .default([]),
  category: z.string().min(1, { message: "Category is required" }),
  availability_start_date: z.string().datetime("Invalid start date format"),
  availability_end_date: z.string().datetime("Invalid end date format"),
  farmer_id: z.string().min(1, { message: "Farmer ID is required" }),
  tags: z.array(z.string()).max(10, { message: "Maximum 10 tags allowed" }).optional(),
  unit: z.enum(["kg", "g", "lb", "oz", "piece", "bunch", "box", "crate", "dozen"]).optional(),
  organic: z.boolean().optional(),
  featured: z.boolean().optional(),
})
.refine(
  (data) => {
    if (data.availability_start_date && data.availability_end_date) {
      return new Date(data.availability_start_date) < new Date(data.availability_end_date);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["availability_end_date"],
  }
);

// Schema for creating a product
export const createProductSchema = productSchema;

// Schema for updating a product - all fields are optional
export const updateProductSchema = productSchema._def.schema.partial();

// Schema for product query parameters
export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  availability_date: z.string().datetime("Invalid date format").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort_by: z.enum(['name', 'price', 'createdAt', 'quantity']).optional().default('createdAt'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  farmer_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  organic: z.boolean().optional(),
  featured: z.boolean().optional(),

  
});

// Schema for product ID parameter
export const productIdSchema = z.object({
  product_id: z.string().min(1, { message: "Product ID is required" }),
});

// Types derived from schemas
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
export type ProductIdParam = z.infer<typeof productIdSchema>;

// Product response type
export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  photos: string[];
  category: string;
  categoryDetails?: {
    name: string;
    slug: string;
  };
  availability_start_date: Date;
  availability_end_date: Date;
  farmer_id: string;
  tags?: string[];
  unit?: string;
  organic?: boolean;
  featured?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}