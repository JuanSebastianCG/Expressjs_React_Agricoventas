import { PrismaClient } from "@prisma/client"
import type {
  CreatePriceHistoryDto,
  UpdatePriceHistoryDto,
  PriceHistoryQueryParams,
  PriceStatisticsQueryParams,
  PriceHistoryResponse,
  PriceStatisticsResponse,
  PaginatedPriceHistoryResponse,
} from "../schemas/priceHistory.schema"

const prisma = new PrismaClient()

export class PriceHistoryService {
  /**
   * Create a new price history entry
   * @param data - Price history data
   * @returns Created price history entry
   */
  async create(data: CreatePriceHistoryDto): Promise<PriceHistoryResponse> {
    // First, verify that the product exists
    const product = await prisma.product.findUnique({
      where: { id: data.product_id },
      select: { id: true, name: true, category: true },
    })

    if (!product) {
      throw new Error("Product not found")
    }

    const priceHistory = await prisma.priceHistory.create({
      data: {
        product_id: data.product_id,
        price: data.price,
        market_name: data.market_name,
        location: data.location,
        quality_grade: data.quality_grade,
        unit: data.unit,
        quantity_available: data.quantity_available,
        notes: data.notes,
        source: data.source || "Manual Entry",
        recorded_by: data.recorded_by!,
        recorded_at: new Date(),
      },
    })

    return {
      id: priceHistory.id,
      product_id: priceHistory.product_id,
      product_name: product.name,
      product_category: product.category,
      price: priceHistory.price,
      market_name: priceHistory.market_name,
      location: priceHistory.location,
      quality_grade: priceHistory.quality_grade as any,
      unit: priceHistory.unit,
      quantity_available: priceHistory.quantity_available || undefined,
      notes: priceHistory.notes || undefined,
      source: priceHistory.source,
      recorded_by: priceHistory.recorded_by,
      recorded_at: priceHistory.recorded_at,
      createdAt: priceHistory.createdAt,
      updatedAt: priceHistory.updatedAt,
    }
  }

  /**
   * Get price history entries with filtering and pagination
   * @param params - Query parameters
   * @returns Paginated price history entries
   */
  async findAll(params: PriceHistoryQueryParams): Promise<PaginatedPriceHistoryResponse> {
    const {
      product_id,
      product_name,
      category,
      market_name,
      location,
      quality_grade,
      start_date,
      end_date,
      min_price,
      max_price,
      source,
      page = 1,
      limit = 20,
      sort_by = "date",
      sort_order = "desc",
    } = params

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}

    // Product filters
    if (product_id) {
      where.product_id = product_id
    }

    if (product_name || category) {
      where.product = {}
      if (product_name) {
        where.product.name = { contains: product_name, mode: "insensitive" }
      }
      if (category) {
        where.product.category = { contains: category, mode: "insensitive" }
      }
    }

    // Market and location filters
    if (market_name) {
      where.market_name = { contains: market_name, mode: "insensitive" }
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    if (quality_grade) {
      where.quality_grade = quality_grade
    }

    // Date range filter
    if (start_date || end_date) {
      where.recorded_at = {}
      if (start_date) where.recorded_at.gte = new Date(start_date)
      if (end_date) where.recorded_at.lte = new Date(end_date)
    }

    // Price range filter
    if (min_price !== undefined || max_price !== undefined) {
      where.price = {}
      if (min_price !== undefined) where.price.gte = min_price
      if (max_price !== undefined) where.price.lte = max_price
    }

    // Source filter
    if (source) {
      where.source = { contains: source, mode: "insensitive" }
    }

    // Build order by clause
    let orderBy: any = {}
    switch (sort_by) {
      case "date":
        orderBy = { recorded_at: sort_order }
        break
      case "price":
        orderBy = { price: sort_order }
        break
      case "product_name":
        orderBy = { product: { name: sort_order } }
        break
      case "market_name":
        orderBy = { market_name: sort_order }
        break
      default:
        orderBy = { recorded_at: sort_order }
    }

    // Get price history entries and total count
    const [priceHistoryEntries, total] = await Promise.all([
      prisma.priceHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          product: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.priceHistory.count({ where }),
    ])

    // Transform the data
    const price_history: PriceHistoryResponse[] = priceHistoryEntries.map((entry: any) => ({
      id: entry.id,
      product_id: entry.product_id,
      product_name: entry.product.name,
      product_category: entry.product.category,
      price: entry.price,
      market_name: entry.market_name,
      location: entry.location,
      quality_grade: entry.quality_grade as any,
      unit: entry.unit,
      quantity_available: entry.quantity_available || undefined,
      notes: entry.notes || undefined,
      source: entry.source,
      recorded_by: entry.recorded_by,
      recorded_at: entry.recorded_at,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))

    return {
      price_history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get a price history entry by ID
   * @param id - Price history ID
   * @returns Price history entry if found, null otherwise
   */
  async findById(id: string): Promise<PriceHistoryResponse | null> {
    const priceHistory = await prisma.priceHistory.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    })

    if (!priceHistory) {
      return null
    }

    return {
      id: priceHistory.id,
      product_id: priceHistory.product_id,
      product_name: priceHistory.product.name,
      product_category: priceHistory.product.category,
      price: priceHistory.price,
      market_name: priceHistory.market_name,
      location: priceHistory.location,
      quality_grade: priceHistory.quality_grade as any,
      unit: priceHistory.unit,
      quantity_available: priceHistory.quantity_available || undefined,
      notes: priceHistory.notes || undefined,
      source: priceHistory.source,
      recorded_by: priceHistory.recorded_by,
      recorded_at: priceHistory.recorded_at,
      createdAt: priceHistory.createdAt,
      updatedAt: priceHistory.updatedAt,
    }
  }

  /**
   * Update a price history entry
   * @param id - Price history ID
   * @param data - Updates for the price history entry
   * @returns Updated price history entry
   */
  async update(id: string, data: UpdatePriceHistoryDto): Promise<PriceHistoryResponse> {
    // If product_id is being updated, verify the new product exists
    if (data.product_id) {
      const product = await prisma.product.findUnique({
        where: { id: data.product_id },
        select: { id: true },
      })

      if (!product) {
        throw new Error("Product not found")
      }
    }

    const updatedPriceHistory = await prisma.priceHistory.update({
      where: { id },
      data,
      include: {
        product: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    })

    return {
      id: updatedPriceHistory.id,
      product_id: updatedPriceHistory.product_id,
      product_name: updatedPriceHistory.product.name,
      product_category: updatedPriceHistory.product.category,
      price: updatedPriceHistory.price,
      market_name: updatedPriceHistory.market_name,
      location: updatedPriceHistory.location,
      quality_grade: updatedPriceHistory.quality_grade as any,
      unit: updatedPriceHistory.unit,
      quantity_available: updatedPriceHistory.quantity_available || undefined,
      notes: updatedPriceHistory.notes || undefined,
      source: updatedPriceHistory.source,
      recorded_by: updatedPriceHistory.recorded_by,
      recorded_at: updatedPriceHistory.recorded_at,
      createdAt: updatedPriceHistory.createdAt,
      updatedAt: updatedPriceHistory.updatedAt,
    }
  }

  /**
   * Delete a price history entry
   * @param id - Price history ID
   * @returns Deleted price history entry
   */
  async delete(id: string): Promise<void> {
    await prisma.priceHistory.delete({
      where: { id },
    })
  }

  /**
   * Get price statistics and analysis
   * @param params - Query parameters
   * @returns Price statistics and analysis
   */
  async getStatistics(params: PriceStatisticsQueryParams): Promise<PriceStatisticsResponse[]> {
    const {
      product_id,
      product_name,
      category,
      market_name,
      location,
      start_date,
      end_date,
      period = "monthly",
      include_trends = true,
      include_forecasts = false,
    } = params

    // Build where clause for filtering
    const where: any = {}

    if (product_id) {
      where.product_id = product_id
    }

    if (product_name || category) {
      where.product = {}
      if (product_name) {
        where.product.name = { contains: product_name, mode: "insensitive" }
      }
      if (category) {
        where.product.category = { contains: category, mode: "insensitive" }
      }
    }

    if (market_name) {
      where.market_name = { contains: market_name, mode: "insensitive" }
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    if (start_date || end_date) {
      where.recorded_at = {}
      if (start_date) where.recorded_at.gte = new Date(start_date)
      if (end_date) where.recorded_at.lte = new Date(end_date)
    }

    // Get all price history entries for analysis
    const priceHistoryEntries = await prisma.priceHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        recorded_at: "asc",
      },
    })

    // Group by product
    const productGroups = new Map<string, any[]>()
    for (const entry of priceHistoryEntries) {
      const key = entry.product_id
      if (!productGroups.has(key)) {
        productGroups.set(key, [])
      }
      productGroups.get(key)!.push(entry)
    }

    const results: PriceStatisticsResponse[] = []

    // Calculate statistics for each product
    for (const [productId, entries] of productGroups) {
      if (entries.length === 0) continue

      const product = entries[0].product
      const prices = entries.map((e: any) => e.price)

      // Basic statistics
      const total_records = entries.length
      const average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const min_price = Math.min(...prices)
      const max_price = Math.max(...prices)
      const price_range = max_price - min_price

      // Calculate median
      const sortedPrices = [...prices].sort((a, b) => a - b)
      const median_price =
        sortedPrices.length % 2 === 0
          ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
          : sortedPrices[Math.floor(sortedPrices.length / 2)]

      // Calculate variance and standard deviation
      const price_variance = prices.reduce((sum, price) => sum + Math.pow(price - average_price, 2), 0) / prices.length
      const price_std_deviation = Math.sqrt(price_variance)
      const coefficient_of_variation = (price_std_deviation / average_price) * 100

      // Generate price trends
      const price_trends = include_trends ? this.generatePriceTrends(entries, period) : []

      // Generate market analysis
      const market_analysis = this.generateMarketAnalysis(entries)

      // Generate seasonal patterns (only for monthly period)
      const seasonal_patterns = period === "monthly" ? this.generateSeasonalPatterns(entries) : undefined

      // Generate forecasts (if requested)
      const forecasts = include_forecasts ? this.generateSimpleForecasts(entries) : undefined

      results.push({
        product_id: productId,
        product_name: product.name,
        category: product.category,
        period,
        statistics: {
          total_records,
          average_price: Math.round(average_price * 100) / 100,
          min_price,
          max_price,
          median_price: Math.round(median_price * 100) / 100,
          price_variance: Math.round(price_variance * 100) / 100,
          price_std_deviation: Math.round(price_std_deviation * 100) / 100,
          price_range,
          coefficient_of_variation: Math.round(coefficient_of_variation * 100) / 100,
        },
        price_trends,
        market_analysis,
        seasonal_patterns,
        forecasts,
      })
    }

    return results
  }

  /**
   * Generate price trends based on period
   * @param entries - Price history entries
   * @param period - Time period for grouping
   * @returns Price trends
   */
  private generatePriceTrends(entries: any[], period: string) {
    const trends = new Map<string, any[]>()

    for (const entry of entries) {
      let key: string
      const date = new Date(entry.recorded_at)

      switch (period) {
        case "daily":
          key = date.toISOString().split("T")[0]
          break
        case "weekly":
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split("T")[0]
          break
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          break
        case "yearly":
          key = String(date.getFullYear())
          break
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }

      if (!trends.has(key)) {
        trends.set(key, [])
      }
      trends.get(key)!.push(entry)
    }

    return Array.from(trends.entries())
      .map(([date, periodEntries]) => {
        const prices = periodEntries.map((e) => e.price)
        return {
          date,
          average_price: Math.round((prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100) / 100,
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
          record_count: periodEntries.length,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Generate market analysis
   * @param entries - Price history entries
   * @returns Market analysis
   */
  private generateMarketAnalysis(entries: any[]) {
    const markets = new Map<string, any[]>()

    for (const entry of entries) {
      const key = `${entry.market_name}|${entry.location}`
      if (!markets.has(key)) {
        markets.set(key, [])
      }
      markets.get(key)!.push(entry)
    }

    return Array.from(markets.entries()).map(([marketKey, marketEntries]) => {
      const [market_name, location] = marketKey.split("|")
      const prices = marketEntries.map((e) => e.price)
      const average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - average_price, 2), 0) / prices.length
      const price_volatility = Math.sqrt(variance)

      return {
        market_name,
        location,
        average_price: Math.round(average_price * 100) / 100,
        record_count: marketEntries.length,
        price_volatility: Math.round(price_volatility * 100) / 100,
      }
    })
  }

  /**
   * Generate seasonal patterns
   * @param entries - Price history entries
   * @returns Seasonal patterns
   */
  private generateSeasonalPatterns(entries: any[]) {
    const months = new Map<number, any[]>()

    for (const entry of entries) {
      const month = new Date(entry.recorded_at).getMonth()
      if (!months.has(month)) {
        months.set(month, [])
      }
      months.get(month)!.push(entry)
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    return Array.from(months.entries()).map(([month, monthEntries]) => {
      const prices = monthEntries.map((e) => e.price)
      const average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - average_price, 2), 0) / prices.length
      const price_volatility = Math.sqrt(variance)

      return {
        month: month + 1,
        month_name: monthNames[month],
        average_price: Math.round(average_price * 100) / 100,
        price_volatility: Math.round(price_volatility * 100) / 100,
        record_count: monthEntries.length,
      }
    })
  }

  /**
   * Generate simple price forecasts
   * @param entries - Price history entries
   * @returns Simple forecasts
   */
  private generateSimpleForecasts(entries: any[]) {
    if (entries.length < 3) return []

    // Sort entries by date
    const sortedEntries = entries.sort(
      (a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )

    // Calculate simple moving average trend
    const recentEntries = sortedEntries.slice(-6) // Last 6 entries
    const prices = recentEntries.map((e: any) => e.price)
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

    // Calculate simple trend (linear regression would be better)
    const trend = prices.length > 1 ? (prices[prices.length - 1] - prices[0]) / (prices.length - 1) : 0

    // Generate forecasts for next 3 periods
    const forecasts = []
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].recorded_at)

    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(lastDate)
      forecastDate.setMonth(forecastDate.getMonth() + i)

      const predicted_price = averagePrice + trend * i
      const confidence_range = averagePrice * 0.1 // 10% confidence interval

      forecasts.push({
        date: forecastDate.toISOString().split("T")[0],
        predicted_price: Math.round(predicted_price * 100) / 100,
        confidence_interval: {
          lower: Math.round((predicted_price - confidence_range) * 100) / 100,
          upper: Math.round((predicted_price + confidence_range) * 100) / 100,
        },
      })
    }

    return forecasts
  }

  /**
   * Check if a price history entry belongs to a user
   * @param historyId - Price history ID
   * @param userId - User ID
   * @returns True if entry belongs to user, false otherwise
   */
  async belongsToUser(historyId: string, userId: string): Promise<boolean> {
    const priceHistory = await prisma.priceHistory.findFirst({
      where: {
        id: historyId,
        recorded_by: userId,
      },
    })

    return !!priceHistory
  }
}
