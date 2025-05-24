import { Request, Response } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { isValidObjectId } from 'mongoose';
import { logger } from '../config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tipos de cambio para el historial de productos
 */
export enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Interfaz para los datos requeridos al registrar un cambio
 */
interface ProductChangeData {
  productId: string;
  userId: string;
  changeType: ChangeType;
  changeField?: string;
  oldValue?: string;
  newValue?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Controlador para gestionar el historial de cambios de productos
 */
export class ProductHistoryController {
  /**
   * Registra un nuevo cambio en el historial de productos
   * @param changeData Datos del cambio a registrar
   * @returns El registro de historial creado
   */
  static async recordChange(changeData: ProductChangeData) {
    try {
      const { productId, userId, changeType, changeField, oldValue, newValue, additionalInfo } = changeData;
      
      const historyRecord = await prisma.productHistory.create({
        data: {
          productId,
          userId,
          changeType,
          changeField,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: newValue ? String(newValue) : null,
          additionalInfo: additionalInfo || {},
          timestamp: new Date()
        }
      });
      
      logger.info(`Producto ${productId} - ${changeType} registrado en historial por usuario ${userId}`);
      return historyRecord;
    } catch (error) {
      logger.error('Error al registrar cambio en historial de producto:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial completo de un producto
   */
  private static async fetchProductHistory(productId: string, limit: number = 20, offset: number = 0) {
    try {
      const history = await prisma.productHistory.findMany({
        where: { productId },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              userType: true
            }
          }
        }
      });
      
      const total = await prisma.productHistory.count({ where: { productId } });
      
      return {
        history,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      logger.error(`Error al obtener historial del producto ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene métricas de cambios para análisis
   */
  private static async fetchChangeMetrics(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    
    if (startDate) {
      dateFilter.gte = startDate;
    }
    
    if (endDate) {
      dateFilter.lte = endDate;
    }
    
    const whereClause = Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {};
    
    try {
      // Contar cambios por tipo
      const changesByType = await prisma.productHistory.groupBy({
        by: ['changeType'],
        _count: { changeType: true },
        where: whereClause
      });
      
      // Contar cambios por campo
      const changesByField = await prisma.productHistory.groupBy({
        by: ['changeField'],
        _count: { changeField: true },
        where: {
          ...whereClause,
          changeField: { not: null }
        }
      });
      
      // Obtener productos más modificados
      const productChanges = await prisma.productHistory.groupBy({
        by: ['productId'],
        _count: { productId: true },
        where: whereClause,
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: 10
      });
      
      // Obtener IDs de los productos más modificados
      const productIds = productChanges.map(p => p.productId);
      
      // Obtener detalles de estos productos
      const productsDetails = productIds.length > 0 ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [];
      
      // Mapear IDs a nombres
      const productNamesMap = Object.fromEntries(
        productsDetails.map(p => [p.id, p.name])
      );
      
      // Formatear resultados para productos más modificados
      const topModifiedProducts = productChanges.map(p => ({
        productId: p.productId,
        productName: productNamesMap[p.productId] || 'Producto desconocido',
        changeCount: p._count.productId
      }));
      
      return {
        changesByType: changesByType.map(c => ({
          type: c.changeType,
          count: c._count.changeType
        })),
        changesByField: changesByField.map(c => ({
          field: c.changeField || 'Desconocido',
          count: c._count.changeField
        })),
        topModifiedProducts
      };
    } catch (error) {
      logger.error('Error al obtener métricas de cambios:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios de un producto específico
   * @param req Request - productId en params, limit y offset en query
   * @param res Response
   */
  static async getProductHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit = '20', offset = '0' } = req.query;
      
      if (!productId || !isValidObjectId(productId)) {
        throw new ApiError(400, 'ID de producto inválido');
      }
      
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 0 || offsetNum < 0) {
        throw new ApiError(400, 'Parámetros de paginación inválidos');
      }
      
      const history = await ProductHistoryController.fetchProductHistory(
        productId,
        limitNum,
        offsetNum
      );
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.statusCode,
            message: error.message
          }
        });
      } else {
        logger.error('Error al obtener historial de producto:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 500,
            message: 'Error interno del servidor al obtener historial'
          }
        });
      }
    }
  }

  /**
   * Obtiene métricas de cambios para análisis de insights
   * @param req Request - startDate y endDate en query
   * @param res Response
   */
  static async getProductChangeMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;
      
      if (startDate) {
        startDateObj = new Date(startDate as string);
        if (isNaN(startDateObj.getTime())) {
          throw new ApiError(400, 'Fecha de inicio inválida');
        }
      }
      
      if (endDate) {
        endDateObj = new Date(endDate as string);
        if (isNaN(endDateObj.getTime())) {
          throw new ApiError(400, 'Fecha de fin inválida');
        }
      }
      
      const metrics = await ProductHistoryController.fetchChangeMetrics(startDateObj, endDateObj);
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.statusCode,
            message: error.message
          }
        });
      } else {
        logger.error('Error al obtener métricas de cambios:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 500,
            message: 'Error interno del servidor al obtener métricas'
          }
        });
      }
    }
  }

  /**
   * Obtiene tendencias de precios de productos para la página de insights
   * @param req Request - timespan (días), categoryId opcional
   * @param res Response
   */
  static async getProductPriceTrends(req: Request, res: Response) {
    try {
      const { timespan = '30', categoryId } = req.query;
      
      const timespanNum = parseInt(timespan as string, 10) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timespanNum);
      
      // Construir la consulta base
      const whereClause: any = {
        changeType: 'UPDATE',
        changeField: 'basePrice',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };
      
      // Obtener los productos con cambios de precio en el período
      const productPriceChanges = await prisma.productHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              unitMeasure: true,
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Agrupar por producto para calcular las tendencias
      const productMap = new Map();
      
      productPriceChanges.forEach(change => {
        if (!change.product) return;
        
        // Si se especificó categoryId y no coincide, omitir
        if (categoryId && change.product.categoryId !== categoryId) return;
        
        const productId = change.productId;
        
        if (!productMap.has(productId)) {
          // Primera vez que vemos este producto
          productMap.set(productId, {
            id: productId,
            name: change.product.name,
            currentPrice: change.product.basePrice,
            oldestPrice: parseFloat(change.oldValue || '0'),
            priceChanges: [
              {
                date: change.timestamp,
                price: parseFloat(change.newValue || '0')
              }
            ],
            unitMeasure: change.product.unitMeasure,
            category: change.product.category?.name || 'Sin categoría',
            categoryId: change.product.categoryId || ''
          });
        } else {
          // Actualizar producto existente
          const product = productMap.get(productId);
          
          // Añadir cambio de precio a la lista
          product.priceChanges.push({
            date: change.timestamp,
            price: parseFloat(change.newValue || '0')
          });
          
          // Actualizar precio más antiguo si esta fecha es anterior
          if (change.timestamp < product.oldestDate) {
            product.oldestPrice = parseFloat(change.oldValue || '0');
            product.oldestDate = change.timestamp;
          }
        }
      });
      
      // Calcular tendencias
      const trends = Array.from(productMap.values()).map(product => {
        // Ordenar cambios por fecha
        product.priceChanges.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // Calcular cambio porcentual
        const oldPrice = product.oldestPrice || product.priceChanges[0]?.price || 0;
        const currentPrice = product.currentPrice;
        const percentChange = oldPrice > 0 ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;
        
        return {
          id: product.id,
          name: product.name,
          currentPrice: currentPrice,
          weeklyTrend: parseFloat(percentChange.toFixed(2)),
          unit: product.unitMeasure,
          category: product.category,
          categoryId: product.categoryId,
          priceHistory: product.priceChanges
        };
      });
      
      // Para completar los datos, agregar productos populares que no han tenido cambios recientes
      if (trends.length < 5) {
        const existingIds = new Set(trends.map(t => t.id));
        const additionalProductsFilter: any = { isActive: true };
        
        if (categoryId) {
          additionalProductsFilter.categoryId = categoryId;
        }
        
        const additionalProducts = await prisma.product.findMany({
          where: {
            ...additionalProductsFilter,
            id: { notIn: Array.from(existingIds) }
          },
          orderBy: { basePrice: 'desc' },
          take: 5 - trends.length,
          select: {
            id: true,
            name: true,
            basePrice: true,
            unitMeasure: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // Añadir productos sin cambios recientes con tendencia neutra
        additionalProducts.forEach(product => {
          trends.push({
            id: product.id,
            name: product.name,
            currentPrice: product.basePrice,
            weeklyTrend: 0, // Sin cambios
            unit: product.unitMeasure,
            category: product.category?.name || 'Sin categoría',
            categoryId: product.categoryId || '',
            priceHistory: [] // Sin historial de cambios
          });
        });
      }
      
      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.statusCode,
            message: error.message
          }
        });
      } else {
        logger.error('Error al obtener tendencias de precios:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 500,
            message: 'Error interno del servidor al obtener tendencias de precios'
          }
        });
      }
    }
  }
}

export default ProductHistoryController; 