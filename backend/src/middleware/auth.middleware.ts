import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      sendErrorResponse(res, "No authorization token provided", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Check if the header starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      sendErrorResponse(res, "Invalid token format", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    if (!token) {
      sendErrorResponse(res, "No token provided", HttpStatusCode.UNAUTHORIZED);
      return;
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; userType: string };

    // Add the user data to the request object
    req.user = {
      userId: decoded.userId,
      userType: decoded.userType,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      sendErrorResponse(res, "Token expired", HttpStatusCode.UNAUTHORIZED);
      return;
    }
    if (error.name === "JsonWebTokenError") {
      sendErrorResponse(res, "Invalid token", HttpStatusCode.UNAUTHORIZED);
      return;
    }
    sendErrorResponse(res, "Authentication failed", HttpStatusCode.UNAUTHORIZED);
  }
};

/**
 * Middleware to authorize users based on roles
 * @param allowedRoles Array of allowed user types
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        sendErrorResponse(res, "Unauthorized", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Check if user has an allowed role
      if (!allowedRoles.includes(req.user.userType)) {
        sendErrorResponse(
          res, 
          "Insufficient permissions to access this resource", 
          HttpStatusCode.FORBIDDEN
        );
        return;
      }

      next();
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  };
};

