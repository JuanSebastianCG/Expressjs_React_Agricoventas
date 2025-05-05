import { z } from 'zod';

// Location ID schema (for path params)
export const locationIdSchema = z.object({
  id: z.string().min(1, 'Location ID is required'),
});

// Base location schema
export const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  country: z.string().default('Colombia'),
  postalCode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Create location schema
export const createLocationSchema = locationSchema;

// Update location schema (all fields optional)
export const updateLocationSchema = locationSchema.partial();

// Add location to user schema
export const addLocationToUserSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  isPrimary: z.boolean().default(false),
});

// Add location to product schema
export const addLocationToProductSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  isPrimary: z.boolean().default(false),
});

// Search locations schema
export const searchLocationsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
}); 