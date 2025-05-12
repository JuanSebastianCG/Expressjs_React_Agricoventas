/**
 * Zod Schema Definitions
 *
 * This file contains all Zod schemas and type definitions used throughout the application.
 * Schemas are organized by domain entities (auth, user, etc.) and include validation rules
 * and error messages.
 */

import { z } from 'zod';
import { User } from '@prisma/client';

// ==================== AUTH SCHEMAS & TYPES ====================

/**
 * User Registration Schema
 *
 * Validates user registration requests
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' })
    .trim(),

  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(30, { message: 'Username cannot exceed 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers and underscores',
    })
    .trim(),

  email: z.string().email({ message: 'Please provide a valid email address' }).trim().toLowerCase(),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),

  role: z
    .enum(['user', 'admin', 'buyer'], {
      message: 'Role must be either "user", "admin" or "buyer"',
    })
    .default('user')
});

export type RegisterUserDto = z.infer<typeof registerSchema>;

/**
 * User Login Schema
 *
 * Validates user login requests
 */
export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }).trim(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

/**
 * JWT and Token related types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * User related types
 */
export interface SafeUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  user: SafeUser;
  tokens?: AuthTokens;
}

/**
 * Transform functions between Prisma and API types
 */

/**
 * Converts a Prisma User to a SafeUser (excludes sensitive data)
 */
export const userToSafeUser = (user: any): SafeUser => {
  // Usar tipado flexible para evitar problemas entre Prisma y SafeUser
  return {
    id: user.id,
    fullName: user.fullName || user.name || '',
    username: user.username || user.email?.split('@')[0] || '',
    email: user.email,
    role: user.role || 'user',
    isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Map RegisterUserDto to Prisma User create input
 */
export const mapRegisterDtoToPrisma = (data: RegisterUserDto) => {
  return {
    fullName: data.fullName,
    username: data.username,
    email: data.email,
    password: data.password, // will be hashed in the service
    role: data.role,
  };
};

// ==================== USER SCHEMAS ====================

/**
 * User Update Schema
 *
 * Validates user update requests
 */
export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' })
    .trim()
    .optional(),

  email: z.string().email({ message: 'Please provide a valid email address' }).trim().toLowerCase().optional(),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
    .optional(),

  role: z
    .enum(['user', 'admin'], {
      errorMap: () => ({ message: 'Role must be either "user" or "admin"' }),
    })
    .optional(),

  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * User ID Parameter Schema
 *
 * Validates user ID in route parameters
 */
export const userIdSchema = z.object({
  id: z
    .string()
    .min(1, { message: 'User ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID format',
    }),
});

export type UserIdParam = z.infer<typeof userIdSchema>;

// _____________  Author Schema  _____________

export const authorSchema = z.object({
  firstName: z.string().min(1, { message: 'Your first name must be at least 1 characters long' }).max(30, {
    message: 'your first name cannot be longer than 30 characters',
  }),
  lastName: z.string().min(1, { message: 'Your last name must be at least 1 characters long' }).max(30, {
    message: 'your last name cannot be longer than 30 characters',
  }),
});
