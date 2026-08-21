import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/responses';
import logger from '../utils/logger';

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
        logger.warn('[VALIDATION] Request rejected', { issues: error.issues });
        return errorResponse(res, 'The request could not be validated', 400, { reason: 'validation_failed' });
      }
      logger.error('[VALIDATION] Unexpected validation failure', { error });
      return errorResponse(res, 'Validation service unavailable', 500);
    }
  };
};
