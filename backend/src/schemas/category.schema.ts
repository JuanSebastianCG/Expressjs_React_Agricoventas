import { z } from "zod"

// Base schema for category validation
export const categorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }).max(100),
  slug: z
    .string()
    .min(1, { message: "Category slug is required" })
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Schema for creating a category
export const createCategorySchema = categorySchema

// Schema for updating a category - all fields are optional
export const updateCategorySchema = categorySchema.partial()

// Schema for category query parameters
export const categoryQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().optional(),
  level: z.coerce.number().int().optional(),
  isActive: z.boolean().optional().default(true),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
})

// Schema for category ID parameter
export const categoryIdSchema = z.object({
  category_id: z.string().min(1, { message: "Category ID is required" }),
})

// Schema for bulk update
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, { message: "At least one category ID is required" }),
  data: updateCategorySchema,
})

// Types derived from schemas
export type CreateCategoryDto = z.infer<typeof createCategorySchema>
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>
export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>
export type CategoryIdParam = z.infer<typeof categoryIdSchema>
export type BulkUpdateDto = z.infer<typeof bulkUpdateSchema>

// Category response type
export interface CategoryResponse {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  level: number
  path: string[]
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Category tree node type for hierarchical responses
export interface CategoryTreeNode extends CategoryResponse {
  children: CategoryTreeNode[]
}
