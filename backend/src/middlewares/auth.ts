import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { IUserJwtPayload } from "../types";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Add user property to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to protect routes
 *
 * Verifies the JWT token in the authorization header
 * and attaches the user information to the request object.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as IUserJwtPayload;

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      next();
      return;
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
      return;
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
    return;
  }
};

/**
 * Admin middleware
 *
 * Checks if the authenticated user has admin role.
 * Must be used after the protect middleware.
 */
export const admin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as an admin",
    });
  }
};
