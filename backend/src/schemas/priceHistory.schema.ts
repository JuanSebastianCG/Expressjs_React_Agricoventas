import { z } from "zod"

// Quality grade enum
export const QualityGradeEnum = z.enum(["Premium", "Standard", "Second", "Processing"])

// Sort options
export const SortByEnum = z.enum(["date", "price", "product_name", "market_name"])
export const SortOrderEnum = z.enum(["asc", "desc"])
export const PeriodEnum = z.enum(["daily", "weekly", "monthly", "yearly"])

// Base price history schema
export const priceHistorySchema = z.object({
  id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  product_category: z.string(),
  price: z.number().positive("Price must be positive"),
  market_name: z.string().min(1, "Market name is required"),
  location: z.string().min(1, "Location is required"),
  quality_grade: QualityGradeEnum.optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity_available: z.number().int().positive().optional(),
  notes: z.string().optional(),
  source: z.string().default("Manual Entry"),
  recorded_by: z.string(),
  recorded_at: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Create price history schema
export const createPriceHistorySchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  price: z.number().positive("Price must be positive"),
  market_name: z.string().min(1, "Market name is required"),
  location: z.string().min(1, "Location is required"),
  quality_grade: QualityGradeEnum.optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity_available: z.number().int().positive().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  recorded_by: z.string().optional(), // Will be set from authenticated user
})

// Update price history schema
export const updatePriceHistorySchema = z.object({
  product_id: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  market_name: z.string().min(1, "Market name is required").optional(),
  location: z.string().min(1, "Location is required").optional(),
  quality_grade: QualityGradeEnum.optional(),
  unit: z.string().min(1, "Unit is required").optional(),
  quantity_available: z.number().int().positive().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
})

// Query parameters schema
export const priceHistoryQuerySchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  category: z.string().optional(),
  market_name: z.string().optional(),
  location: z.string().optional(),
  quality_grade: QualityGradeEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort_by: SortByEnum.default("date"),
  sort_order: SortOrderEnum.default("desc"),
})

// Statistics query parameters schema
export const priceStatisticsQuerySchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  category: z.string().optional(),
  market_name: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  period: PeriodEnum.default("monthly"),
  include_trends: z.coerce.boolean().default(true),
  include_forecasts: z.coerce.boolean().default(false),
})

// Price history ID schema
export const priceHistoryIdSchema = z.object({
  history_id: z.string().min(1, "Price history ID is required"),
})

// Type definitions
export type CreatePriceHistoryDto = z.infer<typeof createPriceHistorySchema>
export type UpdatePriceHistoryDto = z.infer<typeof updatePriceHistorySchema>
export type PriceHistoryQueryParams = z.infer<typeof priceHistoryQuerySchema>
export type PriceStatisticsQueryParams = z.infer<typeof priceStatisticsQuerySchema>
export type QualityGrade = z.infer<typeof QualityGradeEnum>
export type SortBy = z.infer<typeof SortByEnum>
export type SortOrder = z.infer<typeof SortOrderEnum>
export type Period = z.infer<typeof PeriodEnum>

// Response types
export interface PriceHistoryResponse {
  id: string
  product_id: string
  product_name: string
  product_category: string
  price: number
  market_name: string
  location: string
  quality_grade?: QualityGrade
  unit: string
  quantity_available?: number
  notes?: string
  source: string
  recorded_by: string
  recorded_at: Date
  createdAt: Date
  updatedAt: Date
}

export interface PaginatedPriceHistoryResponse {
  price_history: PriceHistoryResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface PriceStatisticsResponse {
  product_id: string
  product_name: string
  category: string
  period: Period
  statistics: {
    total_records: number
    average_price: number
    min_price: number
    max_price: number
    median_price: number
    price_variance: number
    price_std_deviation: number
    price_range: number
    coefficient_of_variation: number
  }
  price_trends: Array<{
    date: string
    average_price: number
    min_price: number
    max_price: number
    record_count: number
  }>
  market_analysis: Array<{
    market_name: string
    location: string
    average_price: number
    record_count: number
    price_volatility: number
  }>
  seasonal_patterns?: Array<{
    month: number
    month_name: string
    average_price: number
    price_volatility: number
    record_count: number
  }>
  forecasts?: Array<{
    date: string
    predicted_price: number
    confidence_interval: {
      lower: number
      upper: number
    }
  }>
}
