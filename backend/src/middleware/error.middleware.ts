import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse, sendNotFoundResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
}

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found middleware
 * - Handles 404 errors for routes that don't exist
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const errorMessage = `Resource not found - ${req.originalUrl}`;
  sendNotFoundResponse(res, errorMessage);
};

/**
 * Error handler middleware
 * - Handles all errors in the application
 */
export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  // Get error details
  const statusCode = 'statusCode' in err ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  // Additional error details for development
  const errorDetails = process.env.NODE_ENV !== 'production' ? { stack: err.stack } : undefined;

  // Send appropriate error response
  sendErrorResponse(res, { message, ...errorDetails }, statusCode);
};
