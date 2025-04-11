import {
    ColombianRegion,
    type WeatherForecastQueryParams,
    type WeatherAlertsQueryParams,
    type WeatherForecastResponse,
    type WeatherAlertsResponse,
    AlertType,
    AlertSeverity,
    type WeatherAPIResponse,
    type WeatherAPIAlert,
    type WeatherAlert,
  } from "../schemas/weather.schema"
  
  export class WeatherService {
    private apiKey: string
    private baseUrl: string
  
    constructor() {
      this.apiKey = process.env.WEATHER_API_KEY || "872e240fea75409a9d103031250804"
      this.baseUrl = "https://api.weatherapi.com/v1"
    }
  
    /**
     * Get weather forecast for a location in Colombia
     * @param params - Query parameters
     * @returns Weather forecast
     */
    async getForecast(params: WeatherForecastQueryParams): Promise<WeatherForecastResponse> {
      try {
        // Prepare query parameters for WeatherAPI
        const query = this.buildLocationQuery(params)
        const days = params.days || 5
        const aqi = params.aqi || "yes"
        const alerts = params.alerts || "yes"
  
        // Call WeatherAPI forecast endpoint
        const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${query}&days=${days}&aqi=${aqi}&alerts=${alerts}`
        const response = await fetch(url)
  
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`WeatherAPI error: ${errorData.error?.message || response.statusText}`)
        }
  
        const data: WeatherAPIResponse = await response.json()
  
        // Transform WeatherAPI response to our API format
        return this.transformForecastResponse(
          data,
          this.determineRegionFromCoordinates(data.location.lat, data.location.lon),
        )
      } catch (error) {
        console.error("Error fetching weather forecast:", error)
        throw new Error("Failed to fetch weather forecast")
      }
    }
  
    /**
     * Get weather alerts for a location in Colombia
     * @param params - Query parameters
     * @returns Weather alerts
     */
    async getAlerts(params: WeatherAlertsQueryParams): Promise<WeatherAlertsResponse> {
      try {
        // Prepare query parameters for WeatherAPI
        const query = this.buildLocationQuery(params)
  
        // Call WeatherAPI forecast endpoint with alerts
        const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${query}&days=1&aqi=no&alerts=yes`
        const response = await fetch(url)
  
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`WeatherAPI error: ${errorData.error?.message || response.statusText}`)
        }
  
        const data: WeatherAPIResponse = await response.json()
  
        // Transform WeatherAPI alerts to our API format
        return this.transformAlertsResponse(data, params)
      } catch (error) {
        console.error("Error fetching weather alerts:", error)
        throw new Error("Failed to fetch weather alerts")
      }
    }
  
    /**
     * Build location query for WeatherAPI
     * @param params - Location parameters
     * @returns Query string
     */
    private buildLocationQuery(params: WeatherForecastQueryParams | WeatherAlertsQueryParams): string {
      // If q parameter is provided, use it directly
      if (params.q) {
        return encodeURIComponent(params.q)
      }
  
      // If latitude and longitude are provided, use them
      if (params.latitude && params.longitude) {
        return `${params.latitude},${params.longitude}`
      }
  
      // If municipality is provided, use it with Colombia as country
      if (params.municipality) {
        return encodeURIComponent(`${params.municipality},Colombia`)
      }
  
      // Default to Bogotá if no location is specified
      return "Bogota,Colombia"
    }
  
    /**
     * Transform WeatherAPI forecast response to our API format
     * @param data - WeatherAPI response
     * @param region - Colombian region
     * @returns Transformed forecast response
     */
    private transformForecastResponse(data: WeatherAPIResponse, region: ColombianRegion): WeatherForecastResponse {
      // Extract location data
      const location = {
        latitude: data.location.lat,
        longitude: data.location.lon,
        municipality: data.location.name,
        department: data.location.region,
        region: region,
      }
  
      // Extract current weather
      const currentWeather = {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        description: data.current.condition.text,
        icon: data.current.condition.icon,
        updatedAt: data.current.last_updated,
      }
  
      // Extract daily forecast
      const dailyForecast =
        data.forecast?.forecastday.map((day) => ({
          date: day.date,
          maxTemperature: day.day.maxtemp_c,
          minTemperature: day.day.mintemp_c,
          precipitation: day.day.totalprecip_mm,
          humidity: day.day.avghumidity,
          windSpeed: day.day.maxwind_kph,
          description: day.day.condition.text,
          icon: day.day.condition.icon,
        })) || []
  
      // Extract hourly forecast for the next 24 hours
      const hourlyForecast =
        data.forecast?.forecastday[0].hour.map((hour) => ({
          time: hour.time.split(" ")[1], // Extract time part from datetime
          temperature: hour.temp_c,
          precipitation: hour.precip_mm,
          humidity: hour.humidity,
          windSpeed: hour.wind_kph,
          description: hour.condition.text,
          icon: hour.condition.icon,
        })) || []
  
      return {
        location,
        currentWeather,
        dailyForecast,
        hourlyForecast,
      }
    }
  
    /**
     * Transform WeatherAPI alerts response to our API format
     * @param data - WeatherAPI response
     * @param params - Original query parameters
     * @returns Transformed alerts response
     */
    private transformAlertsResponse(data: WeatherAPIResponse, params: WeatherAlertsQueryParams): WeatherAlertsResponse {
      // Extract location data
      const region = params.region || this.determineRegionFromCoordinates(data.location.lat, data.location.lon)
      const location = {
        latitude: data.location.lat,
        longitude: data.location.lon,
        municipality: data.location.name,
        department: data.location.region,
        region: region,
      }
  
      // Transform alerts
      const alerts = data.alerts?.alert.map((alert) => this.transformAlert(alert, region)) || []
  
      // Filter alerts by severity and type if specified
      const filteredAlerts = alerts.filter((alert) => {
        if (params.severity && alert.severity !== params.severity) {
          return false
        }
        if (params.type && alert.type !== params.type) {
          return false
        }
        return true
      })
  
      return {
        location,
        alerts: filteredAlerts,
      }
    }
  
    /**
     * Transform a WeatherAPI alert to our API format
     * @param alert - WeatherAPI alert
     * @param region - Colombian region
     * @returns Transformed alert
     */
    private transformAlert(alert: WeatherAPIAlert, region: ColombianRegion): WeatherAlert {
      // Map WeatherAPI alert category to our alert type
      const type = this.mapAlertCategory(alert.category)
  
      // Map WeatherAPI alert severity to our severity levels
      const severity = this.mapAlertSeverity(alert.severity)
  
      // Parse affected areas
      const affectedAreas = alert.areas.split(",").map((area) => area.trim())
  
      // Generate recommendations based on alert type
      const recommendations = this.generateRecommendations(type)
  
      return {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        severity,
        title: alert.headline,
        description: alert.desc,
        affectedAreas,
        startTime: alert.effective,
        endTime: alert.expires,
        recommendations,
        source: "Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM) via WeatherAPI",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  
    /**
     * Map WeatherAPI alert category to our alert type
     * @param category - WeatherAPI alert category
     * @returns Alert type
     */
    private mapAlertCategory(category: string): AlertType {
      const lowerCategory = category.toLowerCase()
  
      if (lowerCategory.includes("flood")) {
        return AlertType.FLOOD
      } else if (lowerCategory.includes("drought")) {
        return AlertType.DROUGHT
      } else if (lowerCategory.includes("landslide")) {
        return AlertType.LANDSLIDE
      } else if (lowerCategory.includes("frost") || lowerCategory.includes("freeze")) {
        return AlertType.FROST
      } else if (lowerCategory.includes("heat")) {
        return AlertType.HEATWAVE
      } else if (lowerCategory.includes("rain")) {
        return AlertType.HEAVYRAIN
      } else if (
        lowerCategory.includes("storm") ||
        lowerCategory.includes("thunder") ||
        lowerCategory.includes("hurricane")
      ) {
        return AlertType.STORM
      } else {
        // Default to heavy rain if category doesn't match
        return AlertType.HEAVYRAIN
      }
    }
  
    /**
     * Map WeatherAPI alert severity to our severity levels
     * @param severity - WeatherAPI alert severity
     * @returns Alert severity
     */
    private mapAlertSeverity(severity: string): AlertSeverity {
      const lowerSeverity = severity.toLowerCase()
  
      if (lowerSeverity.includes("extreme") || lowerSeverity.includes("severe")) {
        return AlertSeverity.SEVERE
      } else if (lowerSeverity.includes("moderate")) {
        return AlertSeverity.MEDIUM
      } else if (lowerSeverity.includes("minor")) {
        return AlertSeverity.LOW
      } else {
        // Default to medium if severity doesn't match
        return AlertSeverity.MEDIUM
      }
    }
  
    /**
     * Generate recommendations based on alert type
     * @param type - Alert type
     * @returns Array of recommendations
     */
    private generateRecommendations(type: AlertType): string[] {
      // Alert recommendations
      const alertRecommendations: Record<AlertType, string[]> = {
        [AlertType.FLOOD]: [
          "Move to higher ground if in flood-prone areas.",
          "Avoid walking or driving through flood waters.",
          "Prepare emergency supplies and evacuation plans.",
          "Monitor local news and weather updates.",
        ],
        [AlertType.DROUGHT]: [
          "Conserve water usage.",
          "Implement irrigation scheduling for crops.",
          "Monitor crop stress and adjust farming practices.",
          "Consider drought-resistant crop varieties for future planting.",
        ],
        [AlertType.LANDSLIDE]: [
          "Avoid steep slopes and areas with recent landslides.",
          "Watch for signs of land movement, such as cracks in the ground.",
          "Prepare for evacuation if in high-risk areas.",
          "Avoid deforested slopes during heavy rainfall.",
        ],
        [AlertType.FROST]: [
          "Cover sensitive crops before nightfall.",
          "Use frost protection methods like sprinklers or heaters.",
          "Harvest mature crops if possible.",
          "Monitor overnight temperatures closely.",
        ],
        [AlertType.HEATWAVE]: [
          "Stay hydrated and avoid strenuous outdoor activities.",
          "Provide shade and water for livestock.",
          "Irrigate crops during cooler parts of the day.",
          "Check on vulnerable community members.",
        ],
        [AlertType.HEAVYRAIN]: [
          "Ensure proper drainage around crops and buildings.",
          "Secure loose items that could be damaged by wind or water.",
          "Delay planting or harvesting activities.",
          "Prepare for possible power outages.",
        ],
        [AlertType.STORM]: [
          "Seek shelter in a sturdy building.",
          "Secure farm equipment and livestock.",
          "Avoid open areas and tall structures during lightning.",
          "Prepare for potential power outages and road closures.",
        ],
      }
  
      // Select 2-4 random recommendations
      const recommendationsCount = Math.floor(Math.random() * 3) + 2 // 2-4
      const recommendations = []
      const availableRecommendations = [...alertRecommendations[type]]
  
      for (let i = 0; i < recommendationsCount; i++) {
        if (availableRecommendations.length === 0) break
  
        const randomIndex = Math.floor(Math.random() * availableRecommendations.length)
        recommendations.push(availableRecommendations[randomIndex])
        availableRecommendations.splice(randomIndex, 1)
      }
  
      return recommendations
    }
  
    /**
     * Determine Colombian region from coordinates
     * @param latitude - Latitude
     * @param longitude - Longitude
     * @returns Colombian region
     */
    private determineRegionFromCoordinates(latitude: number, longitude: number): ColombianRegion {
      // This is a simplified determination of regions based on coordinates
      // In a real implementation, this would use more precise geospatial data
  
      // Andean region (central Colombia)
      if (latitude >= 1 && latitude <= 8 && longitude >= -76 && longitude <= -72) {
        return ColombianRegion.ANDEAN
      }
  
      // Caribbean region (northern Colombia)
      if (latitude >= 8 && latitude <= 13 && longitude >= -77 && longitude <= -70) {
        return ColombianRegion.CARIBBEAN
      }
  
      // Pacific region (western Colombia)
      if (latitude >= 1 && latitude <= 8 && longitude >= -79 && longitude <= -77) {
        return ColombianRegion.PACIFIC
      }
  
      // Orinoco region (eastern Colombia)
      if (latitude >= 2 && latitude <= 7 && longitude >= -72 && longitude <= -67) {
        return ColombianRegion.ORINOCO
      }
  
      // Amazon region (southeastern Colombia)
      if (latitude >= -4 && latitude <= 2 && longitude >= -72 && longitude <= -67) {
        return ColombianRegion.AMAZON
      }
  
      // Default to Andean region if coordinates don't match any region
      return ColombianRegion.ANDEAN
    }
  }
  