import { z } from "zod"

// Base schema for product validation
export const productSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  photos: z.array(z.string().url("Invalid photo URL")).optional().default([]),
  category: z.string().min(1, { message: "Category is required" }),
  availability_start_date: z.string().datetime("Invalid start date format"),
  availability_end_date: z.string().datetime("Invalid end date format"),
  farmer_id: z.string().min(1, { message: "Farmer ID is required" }),
})

// Schema for creating a product
export const createProductSchema = productSchema

// Schema for updating a product - all fields are optional
export const updateProductSchema = productSchema.partial()

// Schema for product query parameters
export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  availability_date: z.string().datetime("Invalid date format").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
})

// Schema for product ID parameter
export const productIdSchema = z.object({
  product_id: z.string().min(1, { message: "Product ID is required" }),
})

// Types derived from schemas
export type CreateProductDto = z.infer<typeof createProductSchema>
export type UpdateProductDto = z.infer<typeof updateProductSchema>
export type ProductQueryParams = z.infer<typeof productQuerySchema>
export type ProductIdParam = z.infer<typeof productIdSchema>

// Product response type
export interface ProductResponse {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  photos: string[]
  category: string
  availability_start_date: Date
  availability_end_date: Date
  farmer_id: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

