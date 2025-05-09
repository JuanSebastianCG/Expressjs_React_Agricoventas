import { z } from "zod";

// Available recommendation types
const RECOMMENDATION_TYPES = ["CARE_TIP", "USAGE_IDEA", "COMPLEMENTARY_PRODUCT"] as const;

// Base schema for product recommendation validation
export const productRecommendationSchema = z.object({
  productTypeId: z.string().min(1, { message: "Product type ID is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  message: z.string().min(1, { message: "Message is required" }),
  recommendedProductId: z.string().min(1, { message: "Recommended product ID is required" }),
  recommendationType: z.enum(RECOMMENDATION_TYPES).optional(),
  isActive: z.boolean().optional().default(true),
});

// Schema for creating a product recommendation
export const createProductRecommendationSchema = productRecommendationSchema;

// Schema for updating a product recommendation
export const updateProductRecommendationSchema = productRecommendationSchema.partial().extend({
  productTypeId: z.string().optional(),
  recommendedProductId: z.string().optional(),
});

// Schema for recommendation query parameters
export const recommendationQuerySchema = z.object({
  productTypeId: z.string().optional(),
  recommendationType: z.enum(RECOMMENDATION_TYPES).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateProductRecommendationDto = z.infer<typeof createProductRecommendationSchema>;
export type UpdateProductRecommendationDto = z.infer<typeof updateProductRecommendationSchema>;
export type RecommendationQueryParams = z.infer<typeof recommendationQuerySchema>;

// Product recommendation response type
export interface ProductRecommendationResponse {
  id: string;
  productTypeId: string;
  title: string;
  message: string;
  recommendedProductId: string;
  recommendationType?: string;
  isActive: boolean;
  createdAt: Date;
  productType?: {
    id: string;
    name: string;
  };
  recommendedProduct?: {
    id: string;
    name: string;
    basePrice: number;
  };
} 