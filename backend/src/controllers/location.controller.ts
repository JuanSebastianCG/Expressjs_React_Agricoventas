import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/location.service';
import { AppError } from '../utils/appError';
import { logger } from '../config/logger';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Create a new location
   */
  createLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = await this.locationService.createLocation(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          location
        }
      });
    } catch (error) {
      logger.error('Error in createLocation controller:', error);
      next(error);
    }
  };

  /**
   * Get all locations
   */
  getAllLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locations = await this.locationService.getAllLocations();
      
      res.status(200).json({
        success: true,
        data: {
          locations
        }
      });
    } catch (error) {
      logger.error('Error in getAllLocations controller:', error);
      next(error);
    }
  };

  /**
   * Get location by ID
   */
  getLocationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const location = await this.locationService.getLocationById(id);
      
      if (!location) {
        return next(new AppError('Location not found', 404));
      }
      
      res.status(200).json({
        success: true,
        data: {
          location
        }
      });
    } catch (error) {
      logger.error('Error in getLocationById controller:', error);
      next(error);
    }
  };

  /**
   * Update a location
   */
  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedLocation = await this.locationService.updateLocation(id, req.body);
      
      res.status(200).json({
        success: true,
        data: {
          location: updatedLocation
        }
      });
    } catch (error) {
      logger.error('Error in updateLocation controller:', error);
      next(error);
    }
  };

  /**
   * Delete a location
   */
  deleteLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.locationService.deleteLocation(id);
      
      res.status(200).json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteLocation controller:', error);
      next(error);
    }
  };

  /**
   * Add location to a user
   */
  addLocationToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: userId } = req.params;
      const { locationId, isPrimary } = req.body;
      
      await this.locationService.addLocationToUser(userId, locationId, isPrimary);
      
      res.status(200).json({
        success: true,
        message: 'Location added to user successfully'
      });
    } catch (error) {
      logger.error('Error in addLocationToUser controller:', error);
      next(error);
    }
  };

  /**
   * Remove location from a user
   */
  removeLocationFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, locationId } = req.params;
      
      await this.locationService.removeLocationFromUser(userId, locationId);
      
      res.status(200).json({
        success: true,
        message: 'Location removed from user successfully'
      });
    } catch (error) {
      logger.error('Error in removeLocationFromUser controller:', error);
      next(error);
    }
  };

  /**
   * Get all locations for a user
   */
  getUserLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: userId } = req.params;
      const locations = await this.locationService.getUserLocations(userId);
      
      res.status(200).json({
        success: true,
        data: {
          locations
        }
      });
    } catch (error) {
      logger.error('Error in getUserLocations controller:', error);
      next(error);
    }
  };

  /**
   * Add location to a product
   */
  addLocationToProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: productId } = req.params;
      const { locationId, isPrimary } = req.body;
      
      await this.locationService.addLocationToProduct(productId, locationId, isPrimary);
      
      res.status(200).json({
        success: true,
        message: 'Location added to product successfully'
      });
    } catch (error) {
      logger.error('Error in addLocationToProduct controller:', error);
      next(error);
    }
  };

  /**
   * Remove location from a product
   */
  removeLocationFromProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId, locationId } = req.params;
      
      await this.locationService.removeLocationFromProduct(productId, locationId);
      
      res.status(200).json({
        success: true,
        message: 'Location removed from product successfully'
      });
    } catch (error) {
      logger.error('Error in removeLocationFromProduct controller:', error);
      next(error);
    }
  };

  /**
   * Get all locations for a product
   */
  getProductLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: productId } = req.params;
      const locations = await this.locationService.getProductLocations(productId);
      
      res.status(200).json({
        success: true,
        data: {
          locations
        }
      });
    } catch (error) {
      logger.error('Error in getProductLocations controller:', error);
      next(error);
    }
  };

  /**
   * Search locations
   */
  searchLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return next(new AppError('Search query is required', 400));
      }
      
      const locations = await this.locationService.searchLocations(query);
      
      res.status(200).json({
        success: true,
        data: {
          locations
        }
      });
    } catch (error) {
      logger.error('Error in searchLocations controller:', error);
      next(error);
    }
  };
} 