import type { Request, Response } from "express"
import { WeatherService } from "../services/weather.service"
import type { WeatherForecastQueryParams, WeatherAlertsQueryParams } from "../schemas/weather.schema"
import HttpStatusCode from "../utils/HttpStatusCode"
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHandler"

export class WeatherController {
  private weatherService: WeatherService

  constructor() {
    this.weatherService = new WeatherService()
  }

  /**
   * Get weather forecast
   * @param req - Express request
   * @param res - Express response
   */
  async getForecast(req: Request, res: Response) {
    try {
      const queryParams: WeatherForecastQueryParams = req.query as any
      const forecast = await this.weatherService.getForecast(queryParams)
      return sendSuccessResponse(res, forecast)
    } catch (error) {
      console.error("Error in weather forecast controller:", error)
      return sendErrorResponse(
        res,
        error instanceof Error ? error.message : "Failed to retrieve weather forecast",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * Get weather alerts
   * @param req - Express request
   * @param res - Express response
   */
  async getAlerts(req: Request, res: Response) {
    try {
      const queryParams: WeatherAlertsQueryParams = req.query as any
      const alerts = await this.weatherService.getAlerts(queryParams)
      return sendSuccessResponse(res, alerts)
    } catch (error) {
      console.error("Error in weather alerts controller:", error)
      return sendErrorResponse(
        res,
        error instanceof Error ? error.message : "Failed to retrieve weather alerts",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
