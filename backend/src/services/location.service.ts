import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../config/logger';

// Define Location type to match our Prisma schema
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LocationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new location
   */
  async createLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    try {
      return await this.prisma.location.create({
        data: locationData,
      }) as unknown as Location;
    } catch (error) {
      logger.error('Error creating location:', error);
      throw new AppError('Failed to create location', 500);
    }
  }

  /**
   * Get all locations
   */
  async getAllLocations(): Promise<Location[]> {
    try {
      return await this.prisma.location.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }) as unknown as Location[];
    } catch (error) {
      logger.error('Error getting locations:', error);
      throw new AppError('Failed to get locations', 500);
    }
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<Location | null> {
    try {
      return await this.prisma.location.findUnique({
        where: { id },
      }) as unknown as Location | null;
    } catch (error) {
      logger.error(`Error getting location with ID ${id}:`, error);
      throw new AppError('Failed to get location', 500);
    }
  }

  /**
   * Update a location
   */
  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    try {
      return await this.prisma.location.update({
        where: { id },
        data,
      }) as unknown as Location;
    } catch (error) {
      logger.error(`Error updating location with ID ${id}:`, error);
      throw new AppError('Failed to update location', 500);
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      await this.prisma.location.delete({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error deleting location with ID ${id}:`, error);
      throw new AppError('Failed to delete location', 500);
    }
  }

  /**
   * Add location to a user
   */
  async addLocationToUser(userId: string, locationId: string, isPrimary: boolean = false): Promise<void> {
    try {
      // If setting as primary, update any existing primary locations
      if (isPrimary) {
        await this.prisma.userLocation.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      await this.prisma.userLocation.create({
        data: {
          userId,
          locationId,
          isPrimary,
        },
      });
    } catch (error) {
      logger.error(`Error adding location ${locationId} to user ${userId}:`, error);
      throw new AppError('Failed to add location to user', 500);
    }
  }

  /**
   * Add location to a product
   */
  async addLocationToProduct(productId: string, locationId: string, isPrimary: boolean = false): Promise<void> {
    try {
      // If setting as primary, update any existing primary locations
      if (isPrimary) {
        await this.prisma.productLocation.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      await this.prisma.productLocation.create({
        data: {
          productId,
          locationId,
          isPrimary,
        },
      });
    } catch (error) {
      logger.error(`Error adding location ${locationId} to product ${productId}:`, error);
      throw new AppError('Failed to add location to product', 500);
    }
  }

  /**
   * Remove location from a user
   */
  async removeLocationFromUser(userId: string, locationId: string): Promise<void> {
    try {
      await this.prisma.userLocation.deleteMany({
        where: {
          userId,
          locationId,
        },
      });
    } catch (error) {
      logger.error(`Error removing location ${locationId} from user ${userId}:`, error);
      throw new AppError('Failed to remove location from user', 500);
    }
  }

  /**
   * Remove location from a product
   */
  async removeLocationFromProduct(productId: string, locationId: string): Promise<void> {
    try {
      await this.prisma.productLocation.deleteMany({
        where: {
          productId,
          locationId,
        },
      });
    } catch (error) {
      logger.error(`Error removing location ${locationId} from product ${productId}:`, error);
      throw new AppError('Failed to remove location from product', 500);
    }
  }

  /**
   * Get all locations for a specific user
   */
  async getUserLocations(userId: string): Promise<Location[]> {
    try {
      const userLocations = await this.prisma.userLocation.findMany({
        where: { userId },
        include: { location: true },
      });
      return userLocations.map((ul: any) => ul.location as Location);
    } catch (error) {
      logger.error(`Error getting locations for user ${userId}:`, error);
      throw new AppError('Failed to get user locations', 500);
    }
  }

  /**
   * Get all locations for a specific product
   */
  async getProductLocations(productId: string): Promise<Location[]> {
    try {
      const productLocations = await this.prisma.productLocation.findMany({
        where: { productId },
        include: { location: true },
      });
      return productLocations.map((pl: any) => pl.location as Location);
    } catch (error) {
      logger.error(`Error getting locations for product ${productId}:`, error);
      throw new AppError('Failed to get product locations', 500);
    }
  }

  /**
   * Search locations by name, city, state or country
   */
  async searchLocations(query: string): Promise<Location[]> {
    try {
      return await this.prisma.location.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { state: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      }) as unknown as Location[];
    } catch (error) {
      logger.error(`Error searching locations with query "${query}":`, error);
      throw new AppError('Failed to search locations', 500);
    }
  }
} 