/**
 * Centralized application configuration
 * Loads and provides access to environment variables
 */

import { logger } from './logger';

// Server configuration
export const SERVER_CONFIG = {
  port: process.env.PORT || '4000',
  env: process.env.NODE_ENV || 'development',
  //frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3005',
};

// Log configuration loading for debugging
logger.info(`Server configuration loaded - Port: ${SERVER_CONFIG.port}, Environment: ${SERVER_CONFIG.env}`);

// CORS configuration
export const CORS_CONFIG = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Cookie configuration
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: SERVER_CONFIG.env === 'production',
  sameSite: SERVER_CONFIG.env === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// JWT configuration
export const JWT_CONFIG = {
  accessTokenExpiry: '15m', // 15 minutes
  refreshTokenExpiry: '7d', // 7 days
  issuer: 'agricoventas-api',
};

// API routes configuration
export const ROUTES_CONFIG = {
  api: '/api',
  auth: '/api/auth',
  users: '/api/users',
  products: '/api/products',
  orders: '/api/orders',
  locations: '/api/locations',
  farmers: '/api/farmers',
  payments: '/api/payments',
  messages: '/api/messages',
  notifications: '/api/notifications',
  analitycs: '/api/analytics',
  weather: '/api/weather',
  market: '/api/market',
  productTypes: '/api/product-types',
  docs: '/api-docs',
};
