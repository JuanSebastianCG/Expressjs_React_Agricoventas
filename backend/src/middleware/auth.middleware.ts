import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { sendUnauthorizedResponse, sendForbiddenResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { ApiError } from './error.middleware';
import { TokenService } from '../services/token.service';

const tokenService = new TokenService();

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * - Verifies the access token in the Authorization header
 * - Adds user info to the request object
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      sendUnauthorizedResponse(res, 'No token provided');
      return;
    }

    // Get token from header (Bearer token)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      sendUnauthorizedResponse(res, 'Invalid token format. Use Bearer token');
      return;
    }

    const token = parts[1];

    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      sendUnauthorizedResponse(res, 'Token has been invalidated');
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      sendUnauthorizedResponse(res, 'Invalid or expired token');
      return;
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    // Continue to next middleware
    next();
  } catch (error) {
    next(new ApiError(HttpStatusCode.UNAUTHORIZED, 'Authentication failed'));
  }
};

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user exists on request
      if (!req.user) {
        sendUnauthorizedResponse(res, 'Authentication required');
        return;
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        sendForbiddenResponse(res, `Access denied. Required role: ${roles.join(' or ')}`);
        return;
      }

      // Continue to next middleware
      next();
    } catch (error) {
      next(new ApiError(HttpStatusCode.FORBIDDEN, 'Authorization failed'));
    }
  };
};

