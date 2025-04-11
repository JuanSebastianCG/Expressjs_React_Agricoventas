import { z } from "zod"

// Colombian regions
export enum ColombianRegion {
  ANDEAN = "andean",
  CARIBBEAN = "caribbean",
  PACIFIC = "pacific",
  ORINOCO = "orinoco",
  AMAZON = "amazon",
}

// Weather alert severity levels
export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  SEVERE = "severe",
}

// Weather alert types
export enum AlertType {
  FLOOD = "flood",
  DROUGHT = "drought",
  LANDSLIDE = "landslide",
  FROST = "frost",
  HEATWAVE = "heatwave",
  HEAVYRAIN = "heavy_rain",
  STORM = "storm",
}

// Schema for weather forecast query parameters
export const weatherForecastQuerySchema = z.object({
  latitude: z.coerce
    .number()
    .min(-4.23, { message: "Latitude must be within Colombia's boundaries" })
    .max(13.39, { message: "Latitude must be within Colombia's boundaries" })
    .optional(),
  longitude: z.coerce
    .number()
    .min(-81.73, { message: "Longitude must be within Colombia's boundaries" })
    .max(-66.87, { message: "Longitude must be within Colombia's boundaries" })
    .optional(),
  q: z.string().optional(), // City name, lat/lon coordinates, or postal code
  region: z.nativeEnum(ColombianRegion).optional(),
  municipality: z.string().optional(),
  department: z.string().optional(),
  days: z.coerce.number().int().min(1).max(10).optional().default(5),
  aqi: z.enum(["yes", "no"]).optional().default("yes"), // Include air quality data
  alerts: z.enum(["yes", "no"]).optional().default("yes"), // Include weather alerts
})

// Schema for weather alerts query parameters
export const weatherAlertsQuerySchema = z.object({
  latitude: z.coerce
    .number()
    .min(-4.23, { message: "Latitude must be within Colombia's boundaries" })
    .max(13.39, { message: "Latitude must be within Colombia's boundaries" })
    .optional(),
  longitude: z.coerce
    .number()
    .min(-81.73, { message: "Longitude must be within Colombia's boundaries" })
    .max(-66.87, { message: "Longitude must be within Colombia's boundaries" })
    .optional(),
  q: z.string().optional(), // City name, lat/lon coordinates, or postal code
  region: z.nativeEnum(ColombianRegion).optional(),
  municipality: z.string().optional(),
  department: z.string().optional(),
  severity: z.nativeEnum(AlertSeverity).optional(),
  type: z.nativeEnum(AlertType).optional(),
})

// Types derived from schemas
export type WeatherForecastQueryParams = z.infer<typeof weatherForecastQuerySchema>
export type WeatherAlertsQueryParams = z.infer<typeof weatherAlertsQuerySchema>

// Weather API response interfaces
export interface WeatherAPILocation {
  name: string
  region: string
  country: string
  lat: number
  lon: number
  tz_id: string
  localtime_epoch: number
  localtime: string
}

export interface WeatherAPICurrent {
  last_updated_epoch: number
  last_updated: string
  temp_c: number
  temp_f: number
  is_day: number
  condition: {
    text: string
    icon: string
    code: number
  }
  wind_mph: number
  wind_kph: number
  wind_degree: number
  wind_dir: string
  pressure_mb: number
  pressure_in: number
  precip_mm: number
  precip_in: number
  humidity: number
  cloud: number
  feelslike_c: number
  feelslike_f: number
  vis_km: number
  vis_miles: number
  uv: number
  gust_mph: number
  gust_kph: number
  air_quality?: {
    co: number
    no2: number
    o3: number
    so2: number
    pm2_5: number
    pm10: number
    "us-epa-index": number
    "gb-defra-index": number
  }
}

export interface WeatherAPIForecastDay {
  date: string
  date_epoch: number
  day: {
    maxtemp_c: number
    maxtemp_f: number
    mintemp_c: number
    mintemp_f: number
    avgtemp_c: number
    avgtemp_f: number
    maxwind_mph: number
    maxwind_kph: number
    totalprecip_mm: number
    totalprecip_in: number
    totalsnow_cm: number
    avgvis_km: number
    avgvis_miles: number
    avghumidity: number
    daily_will_it_rain: number
    daily_chance_of_rain: number
    daily_will_it_snow: number
    daily_chance_of_snow: number
    condition: {
      text: string
      icon: string
      code: number
    }
    uv: number
  }
  astro: {
    sunrise: string
    sunset: string
    moonrise: string
    moonset: string
    moon_phase: string
    moon_illumination: string
    is_moon_up: number
    is_sun_up: number
  }
  hour: Array<{
    time_epoch: number
    time: string
    temp_c: number
    temp_f: number
    is_day: number
    condition: {
      text: string
      icon: string
      code: number
    }
    wind_mph: number
    wind_kph: number
    wind_degree: number
    wind_dir: string
    pressure_mb: number
    pressure_in: number
    precip_mm: number
    precip_in: number
    humidity: number
    cloud: number
    feelslike_c: number
    feelslike_f: number
    windchill_c: number
    windchill_f: number
    heatindex_c: number
    heatindex_f: number
    dewpoint_c: number
    dewpoint_f: number
    will_it_rain: number
    chance_of_rain: number
    will_it_snow: number
    chance_of_snow: number
    vis_km: number
    vis_miles: number
    gust_mph: number
    gust_kph: number
    uv: number
  }>
}

export interface WeatherAPIForecast {
  forecastday: WeatherAPIForecastDay[]
}

export interface WeatherAPIAlert {
  headline: string
  msgtype: string
  severity: string
  urgency: string
  areas: string
  category: string
  certainty: string
  event: string
  note: string
  effective: string
  expires: string
  desc: string
  instruction: string
}

export interface WeatherAPIResponse {
  location: WeatherAPILocation
  current: WeatherAPICurrent
  forecast?: WeatherAPIForecast
  alerts?: {
    alert: WeatherAPIAlert[]
  }
}

// Our API response types
export interface DailyForecast {
  date: string
  maxTemperature: number
  minTemperature: number
  precipitation: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
}

export interface HourlyForecast {
  time: string
  temperature: number
  precipitation: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
}

export interface WeatherForecastResponse {
  location: {
    latitude: number
    longitude: number
    municipality: string
    department: string
    region: ColombianRegion
  }
  currentWeather: {
    temperature: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    updatedAt: string
  }
  dailyForecast: DailyForecast[]
  hourlyForecast: HourlyForecast[]
}

export interface WeatherAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  affectedAreas: string[]
  startTime: string
  endTime: string
  recommendations: string[]
  source: string
  createdAt: string
  updatedAt: string
}

export interface WeatherAlertsResponse {
  location: {
    latitude: number
    longitude: number
    municipality: string
    department: string
    region: ColombianRegion
  }
  alerts: WeatherAlert[]
}
