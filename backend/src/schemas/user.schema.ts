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
    .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre completo no puede exceder los 100 caracteres' })
    .trim(),

  username: z
    .string()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(30, { message: 'El nombre de usuario no puede exceder los 30 caracteres' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
    })
    .trim(),

  email: z.string().email({ message: 'Por favor proporcione un correo electrónico válido' }).trim().toLowerCase(),

  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .max(100, { message: 'La contraseña no puede exceder los 100 caracteres' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula' })
    .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número' })
    .regex(/[^A-Za-z0-9]/, { message: 'La contraseña debe contener al menos un carácter especial' }),
    
  location: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').optional(),
    city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').optional(),
    state: z.string().min(2, 'El departamento debe tener al menos 2 caracteres').optional(),
    country: z.string().default('Colombia'),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
});

export type RegisterUserDto = z.infer<typeof registerSchema>;

/**
 * User Login Schema
 *
 * Validates user login requests
 */
export const loginSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido' }).trim(),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
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
    .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre completo no puede exceder los 100 caracteres' })
    .trim()
    .optional(),

  email: z.string().email({ message: 'Por favor proporcione un correo electrónico válido' }).trim().toLowerCase().optional(),

  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .max(100, { message: 'La contraseña no puede exceder los 100 caracteres' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula' })
    .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número' })
    .regex(/[^A-Za-z0-9]/, { message: 'La contraseña debe contener al menos un carácter especial' })
    .optional(),

  role: z
    .enum(['user', 'admin'], {
      errorMap: () => ({ message: 'El rol debe ser "user" o "admin"' }),
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
    .min(1, { message: 'El ID de usuario es requerido' })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Formato de ID de usuario inválido',
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
