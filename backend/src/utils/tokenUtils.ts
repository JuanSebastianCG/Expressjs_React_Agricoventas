import jwt, { JwtPayload as JwtPayloadBase, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, RefreshTokenPayload, AuthTokens } from '../types/zod';
import { JWT_CONFIG } from '../config/app';

// Define StringValue type to match jsonwebtoken's expected type
type StringValue = string | { toString(): string };

// Get JWT secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key';

// Opciones comunes para JWT
const accessTokenOptions: SignOptions = {
  // @ts-ignore: JWT expects a specific StringValue type, but string literals work fine at runtime
  expiresIn: JWT_CONFIG.accessTokenExpiry,
  issuer: JWT_CONFIG.issuer,
};

const refreshTokenOptions: SignOptions = {
  // @ts-ignore: JWT expects a specific StringValue type, but string literals work fine at runtime
  expiresIn: JWT_CONFIG.refreshTokenExpiry,
  issuer: JWT_CONFIG.issuer,
};

/**
 * Generate an access token
 * @param payload - JWT payload with user information
 * @returns Access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, accessTokenOptions);
};

/**
 * Generate a refresh token
 * @param userId - User ID
 * @returns Refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const tokenId = uuidv4();
  const payload: RefreshTokenPayload = { userId, tokenId };

  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshTokenOptions);
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

/**
 * Get time until token expiration
 * @param token - JWT token to check
 * @param isRefreshToken - Whether this is a refresh token or an access token
 * @returns Time remaining in seconds, or 0 if the token is invalid or expired
 */
export const getTokenTimeRemaining = (token: string, isRefreshToken = false): number => {
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || typeof decoded === 'string') {
      return 0;
    }

    const payload = decoded.payload as JwtPayloadBase;
    if (!payload.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeRemaining = Math.max(0, expirationTime - currentTime) / 1000;

    return Math.floor(timeRemaining);
  } catch (error) {
    return 0;
  }
};
