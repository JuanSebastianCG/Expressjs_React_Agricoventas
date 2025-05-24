import api from './api';

export interface WeatherAlert {
  id: string;
  type: string;
  region: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  icon: string;
  startDate: string;
  endDate: string;
}

export interface FarmingTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  categoryId?: string;
  categoryName?: string;
  region?: string;
}

export interface MarketForecast {
  type: 'supply' | 'demand' | 'price';
  status: string;
  description: string;
  value: string;
  trend: number;
  icon: string;
  categoryId?: string;
  categoryName?: string;
}

export interface InsightData {
  weatherAlerts: WeatherAlert[];
  farmingTips: FarmingTip[];
  marketForecasts: MarketForecast[];
}

class InsightService {
  /**
   * Obtiene todas las alertas de clima disponibles
   * @param region Filtrar por región
   * @returns Lista de alertas climáticas
   */
  async getWeatherAlerts(region?: string): Promise<WeatherAlert[]> {
    try {
      // Simulación de datos de alerta climática
      // En un sistema real, esto haría una petición a la API
      
      return [
        { 
          id: '1',
          type: 'Flood Warning', 
          region: 'Casanare', 
          message: 'Heavy rainfall expected in the next 60 hours. Secure crops and prepare drainage systems.',
          severity: 'medium',
          icon: 'rain',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          id: '2',
          type: 'Heat Wave Alert', 
          region: 'Antioquia', 
          message: 'Extreme temperatures forecasted. Increase irrigation frequency and provide shade where possible.',
          severity: 'high',
          icon: 'sun',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'Frost Warning',
          region: 'Boyacá',
          message: 'Overnight temperatures expected to drop below freezing. Protect sensitive crops.',
          severity: 'medium',
          icon: 'snow',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'Drought Alert',
          region: 'La Guajira',
          message: 'Extended dry period forecasted. Conserve water and implement drought management strategies.',
          severity: 'high',
          icon: 'drought',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ].filter(alert => !region || alert.region === region);
    } catch (error) {
      console.error('Error obteniendo alertas climáticas:', error);
      return [];
    }
  }
  
  /**
   * Obtiene consejos agrícolas
   * @param categoryId Filtrar por categoría
   * @returns Lista de consejos agrícolas
   */
  async getFarmingTips(categoryId?: string): Promise<FarmingTip[]> {
    try {
      // Simulación de datos de consejos agrícolas
      
      return [
        {
          id: '1',
          title: 'Tiempo ideal de siembra',
          description: 'Perfect conditions for planting avocados in Antioquia region this week.',
          icon: 'seed',
          categoryId: 'avocado-category',
          categoryName: 'Aguacates',
          region: 'Antioquia'
        },
        {
          id: '2',
          title: 'Consejos de riego',
          description: 'Reduce watering frequency for coffee plants due to expected rainfall.',
          icon: 'water',
          categoryId: 'coffee-category',
          categoryName: 'Café',
          region: 'Huila'
        },
        {
          id: '3',
          title: 'Control de plagas',
          description: 'Increased risk of aphid infestation in tomato crops. Apply organic pesticides preventatively.',
          icon: 'bug',
          categoryId: 'tomato-category',
          categoryName: 'Tomates',
          region: 'Valle del Cauca'
        },
        {
          id: '4',
          title: 'Preparación de suelo',
          description: 'Ideal time to add lime to acidic soils before the rainy season begins.',
          icon: 'soil',
          categoryId: 'general',
          categoryName: 'General',
          region: 'Nacional'
        }
      ].filter(tip => !categoryId || tip.categoryId === categoryId);
    } catch (error) {
      console.error('Error obteniendo consejos agrícolas:', error);
      return [];
    }
  }
  
  /**
   * Obtiene pronósticos del mercado
   * @param categoryId Filtrar por categoría
   * @returns Lista de pronósticos de mercado
   */
  async getMarketForecasts(categoryId?: string): Promise<MarketForecast[]> {
    try {
      // Simulación de datos de pronóstico de mercado
      
      return [
        {
          type: 'supply',
          status: 'Surplus',
          description: 'Esperado para Q2 2025',
          value: '+15%',
          trend: 15,
          icon: 'chart-up',
          categoryId: 'coffee-category',
          categoryName: 'Café'
        },
        {
          type: 'demand',
          status: 'Crecimiento',
          description: '+15% vs mes pasado',
          value: '+15%',
          trend: 15,
          icon: 'users',
          categoryId: 'vegetables-category',
          categoryName: 'Verduras'
        },
        {
          type: 'price',
          status: 'Estable',
          description: 'Próximos 30 días',
          value: '0%',
          trend: 0,
          icon: 'tag',
          categoryId: 'fruit-category',
          categoryName: 'Frutas'
        },
        {
          type: 'price',
          status: 'Descenso',
          description: 'Próximos 60 días',
          value: '-5%',
          trend: -5,
          icon: 'chart-down',
          categoryId: 'grain-category',
          categoryName: 'Granos'
        }
      ].filter(forecast => !categoryId || forecast.categoryId === categoryId);
    } catch (error) {
      console.error('Error obteniendo pronósticos de mercado:', error);
      return [];
    }
  }
  
  /**
   * Obtiene todos los datos de insights
   * @returns Todos los datos de insights
   */
  async getAllInsightData(): Promise<InsightData> {
    try {
      // Obtenemos todos los datos de insights en paralelo
      const [weatherAlerts, farmingTips, marketForecasts] = await Promise.all([
        this.getWeatherAlerts(),
        this.getFarmingTips(),
        this.getMarketForecasts()
      ]);
      
      return {
        weatherAlerts,
        farmingTips,
        marketForecasts
      };
    } catch (error) {
      console.error('Error obteniendo datos de insights:', error);
      return {
        weatherAlerts: [],
        farmingTips: [],
        marketForecasts: []
      };
    }
  }
}

export default new InsightService(); 