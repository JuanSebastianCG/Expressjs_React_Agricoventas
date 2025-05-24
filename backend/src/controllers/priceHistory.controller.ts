import type { Request, Response } from "express"
import { PriceHistoryService } from "../services/priceHistory.service"
import type {
  CreatePriceHistoryDto,
  UpdatePriceHistoryDto,
  PriceHistoryQueryParams,
  PriceStatisticsQueryParams,
} from "../schemas/priceHistory.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler"

export class PriceHistoryController {
  private priceHistoryService: PriceHistoryService

  constructor() {
    this.priceHistoryService = new PriceHistoryService()
  }

  /**
   * Create a new price history entry
   * @param req - Express request
   * @param res - Express response
   */
  async createPriceHistory(req: Request, res: Response) {
    try {
      const priceHistoryData: CreatePriceHistoryDto = {
        ...req.body,
        recorded_by: req.user?.userId, // Use userId instead of id
      }

      const priceHistory = await this.priceHistoryService.create(priceHistoryData)

      return sendSuccessResponse(res, priceHistory, HttpStatusCode.CREATED)
    } catch (error) {
      console.error("Error creating price history:", error)

      if (error instanceof Error && error.message === "Product not found") {
        return sendErrorResponse(res, "Product not found", HttpStatusCode.NOT_FOUND, "PRODUCT_NOT_FOUND")
      }

      return sendErrorResponse(res, "Failed to create price history", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get a price history entry by ID
   * @param req - Express request
   * @param res - Express response
   */
  async getPriceHistoryById(req: Request, res: Response) {
    try {
      const historyId = req.params.history_id
      const priceHistory = await this.priceHistoryService.findById(historyId)

      if (!priceHistory) {
        return sendNotFoundResponse(res, "Price history entry not found")
      }

      return sendSuccessResponse(res, priceHistory)
    } catch (error) {
      console.error("Error retrieving price history:", error)
      return sendErrorResponse(res, "Failed to retrieve price history", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get price history entries with filtering and pagination
   * @param req - Express request
   * @param res - Express response
   */
  async getPriceHistory(req: Request, res: Response) {
    try {
      const queryParams: PriceHistoryQueryParams = {
        product_id: req.query.product_id as string,
        product_name: req.query.product_name as string,
        category: req.query.category as string,
        market_name: req.query.market_name as string,
        location: req.query.location as string,
        quality_grade: req.query.quality_grade as any,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
        max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
        source: req.query.source as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any,
      }

      const result = await this.priceHistoryService.findAll(queryParams)

      return sendSuccessResponse(res, result)
    } catch (error) {
      console.error("Error retrieving price history:", error)
      return sendErrorResponse(res, "Failed to retrieve price history", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Update a price history entry
   * @param req - Express request
   * @param res - Express response
   */
  async updatePriceHistory(req: Request, res: Response) {
    try {
      const historyId = req.params.history_id
      const userId = req.user?.userId // Use userId instead of id

      // Check if price history entry exists
      const priceHistory = await this.priceHistoryService.findById(historyId)
      if (!priceHistory) {
        return sendNotFoundResponse(res, "Price history entry not found")
      }

      // Check if entry belongs to the authenticated user (or if user is admin)
      const isOwner = await this.priceHistoryService.belongsToUser(historyId, userId!)
      if (!isOwner && req.user?.role !== "admin") {
        return sendErrorResponse(
          res,
          "You can only update your own price history entries",
          HttpStatusCode.FORBIDDEN,
          "FORBIDDEN",
        )
      }

      // Update price history entry
      const updateData: UpdatePriceHistoryDto = req.body
      const updatedPriceHistory = await this.priceHistoryService.update(historyId, updateData)

      return sendSuccessResponse(res, updatedPriceHistory)
    } catch (error) {
      console.error("Error updating price history:", error)

      if (error instanceof Error && error.message === "Product not found") {
        return sendErrorResponse(res, "Product not found", HttpStatusCode.NOT_FOUND, "PRODUCT_NOT_FOUND")
      }

      return sendErrorResponse(res, "Failed to update price history", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Delete a price history entry
   * @param req - Express request
   * @param res - Express response
   */
  async deletePriceHistory(req: Request, res: Response) {
    try {
      const historyId = req.params.history_id
      const userId = req.user?.userId // Use userId instead of id

      // Check if price history entry exists
      const priceHistory = await this.priceHistoryService.findById(historyId)
      if (!priceHistory) {
        return sendNotFoundResponse(res, "Price history entry not found")
      }

      // Check if entry belongs to the authenticated user (or if user is admin)
      const isOwner = await this.priceHistoryService.belongsToUser(historyId, userId!)
      if (!isOwner && req.user?.role !== "admin") {
        return sendErrorResponse(
          res,
          "You can only delete your own price history entries",
          HttpStatusCode.FORBIDDEN,
          "FORBIDDEN",
        )
      }

      // Delete price history entry
      await this.priceHistoryService.delete(historyId)

      return sendSuccessResponse(res, null, HttpStatusCode.NO_CONTENT)
    } catch (error) {
      console.error("Error deleting price history:", error)
      return sendErrorResponse(res, "Failed to delete price history", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Get price statistics and analysis
   * @param req - Express request
   * @param res - Express response
   */
  async getPriceStatistics(req: Request, res: Response) {
    try {
      const queryParams: PriceStatisticsQueryParams = {
        product_id: req.query.product_id as string,
        product_name: req.query.product_name as string,
        category: req.query.category as string,
        market_name: req.query.market_name as string,
        location: req.query.location as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        period: req.query.period as any,
        include_trends: req.query.include_trends === "true",
        include_forecasts: req.query.include_forecasts === "true",
      }

      const statistics = await this.priceHistoryService.getStatistics(queryParams)

      return sendSuccessResponse(res, statistics)
    } catch (error) {
      console.error("Error retrieving price statistics:", error)
      return sendErrorResponse(res, "Failed to retrieve price statistics", HttpStatusCode.INTERNAL_SERVER_ERROR)
    }
  }
}
