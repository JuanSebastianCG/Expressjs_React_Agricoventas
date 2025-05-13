import { z } from 'zod';

// Base schema for Category
export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }),
  description: z.string().optional(),
  iconUrl: z.string().url({ message: 'Icon URL must be a valid URL' }).optional(),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Parent ID must be a valid ObjectId' }).optional().nullable(), // Optional, for parent category
});

// Schema for creating a new category
export const createCategorySchema = categorySchema;

// Schema for updating an existing category (all fields optional)
export const updateCategorySchema = categorySchema.partial();

// Query parameters for fetching categories
export const categoryQuerySchema = z.object({
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Parent ID must be a valid ObjectId' }).optional(),
  includeChildren: z.boolean().optional().default(false),
  includeParent: z.boolean().optional().default(false),
  level: z.number().int().min(1).max(2).optional(), // For fetching specific levels
});

// Type for creating a category
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

// Type for updating a category
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

// Type for category query parameters
export type CategoryQueryDto = z.infer<typeof categoryQuerySchema>;

// Interface for Category response (can include parent and children)
export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  parent?: CategoryResponse | null;     // Optional parent category
  children?: CategoryResponse[];    // Optional list of child categories
  // Add productCount or recommendationCount if needed later
} 