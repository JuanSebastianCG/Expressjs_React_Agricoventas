import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, RefreshTokenPayload, AuthTokens } from '../types/zod';

// Get JWT configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate an access token
 * @param payload - JWT payload with user information
 * @returns Access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET);
};

/**
 * Generate a refresh token
 * @param userId - User ID
 * @returns Refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const tokenId = uuidv4();
  const payload: RefreshTokenPayload = { userId, tokenId };
  return jwt.sign(payload, JWT_REFRESH_SECRET);
};

/**
 * Generate both access and refresh tokens
 * @param payload - JWT payload with user information
 * @returns Object containing access and refresh tokens
 */
export const generateTokens = (payload: JwtPayload): AuthTokens => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify an access token
 * @param token - Access token to verify
 * @returns JWT payload if valid, null otherwise
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 * @param token - Refresh token to verify
 * @returns JWT payload if valid, null otherwise
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
