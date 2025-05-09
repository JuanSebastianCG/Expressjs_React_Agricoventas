import { z } from "zod";

// Base schema for product type validation
export const productTypeSchema = z.object({
  name: z.string().min(1, { message: "Product type name is required" }),
  description: z.string().optional(),
  iconUrl: z.string().url({ message: "Icon URL must be a valid URL" }).optional(),
});

// Schema for creating a product type
export const createProductTypeSchema = productTypeSchema;

// Schema for updating a product type - all fields are optional
export const updateProductTypeSchema = productTypeSchema.partial();

// Types derived from schemas
export type CreateProductTypeDto = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeDto = z.infer<typeof updateProductTypeSchema>;

// Product type response type
export interface ProductTypeResponse {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  createdAt: Date;
} 