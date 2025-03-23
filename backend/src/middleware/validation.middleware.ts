/**
 * Request Validation Middleware
 *
 * This middleware validates incoming requests against Zod schemas.
 * It can validate request body, query parameters, and URL parameters.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * Creates a middleware that validates request data against a Zod schema
 *
 * @param schema - The Zod schema to validate against
 * @param source - The part of the request to validate (body, query, params)
 * @returns Express middleware function
 */
export const validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get the data from the specified request source
      const data = req[source];

      // Validate the data against the schema
      const validatedData = await schema.parseAsync(data);

      // Replace the request data with the validated data
      req[source] = validatedData;

      // Continue to the next middleware/controller
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format validation errors
        const formattedErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);

        // Send a standardized validation error response
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Validation failed',
            errors: formattedErrors,
          },
        });
        return;
      }

      // If not a validation error, pass to the next error handler
      next(error);
    }
  };
};
