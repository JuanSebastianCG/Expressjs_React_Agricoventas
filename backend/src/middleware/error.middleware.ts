import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse, sendNotFoundResponse, sendCorsErrorResponse } from '../utils/responseHandler';
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
  // Evitar que el error se propague y cierre la aplicación
  try {
    console.error('Error:', err);

    // Get error details
    const statusCode = 'statusCode' in err ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
    let message = err.message || 'Internal Server Error';
    
    // Detectar tipos específicos de errores
    if (err.name === 'CORSError' || message.includes('CORS')) {
      // Usar el manejador específico para errores CORS
      sendCorsErrorResponse(res);
      return;
    }

    // Additional error details for development
    const errorDetails = process.env.NODE_ENV !== 'production' 
      ? { stack: err.stack, name: err.name } 
      : undefined;

    // Send appropriate error response
    sendErrorResponse(res, { message, ...errorDetails }, statusCode);
  } catch (internalError) {
    // En caso de error en el manejador de errores, enviamos una respuesta genérica
    console.error('Error in error handler:', internalError);
    res.status(500).json({
      success: false,
      error: { message: 'An unexpected error occurred while processing the error' }
    });
  }
};
