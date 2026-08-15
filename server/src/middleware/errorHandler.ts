import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/responses';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log to Winston
  logger.error(`[ERROR] ${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    authUserId: (req as any).auth?.userId || (req as any).auth?.sub
  });

  if (err.name === 'ZodError') {
    return errorResponse(res, 'Validation failed', 400, err.errors);
  }

  if (err.status === 401 || err.name === 'UnauthorizedError') {
    return errorResponse(res, 'Unauthorized', 401, err.message);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, message, status, process.env.NODE_ENV === 'development' ? err : undefined);
};
