import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/responses';

/**
 * Middleware to validate request body using Zod
 * @param schema Zod schema to validate against
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          res,
          'Validation failed',
          400,
          error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        );
      }
      return errorResponse(res, 'Internal server error during validation', 500);
    }
  };
};
