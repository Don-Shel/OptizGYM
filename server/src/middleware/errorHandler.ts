import type { ErrorRequestHandler } from 'express';
import { failResponse } from '../utils/responses';
import logger from '../utils/logger';

const isValidStatus = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599;

const getRequestId = (req: any): string | undefined =>
  typeof req.id === 'string' ? req.id : undefined;

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const requestId = getRequestId(req);
  const status = isValidStatus(err?.statusCode)
    ? err.statusCode
    : isValidStatus(err?.status)
      ? err.status
      : 500;
  const isOperational = err?.isOperational === true;
  const publicCode = isOperational && typeof err?.code === 'string'
    ? err.code
    : status === 400
      ? 'BAD_REQUEST'
      : status === 401
        ? 'UNAUTHORIZED'
        : status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'NOT_FOUND'
            : status === 409
              ? 'CONFLICT'
              : status === 422
                ? 'VALIDATION_FAILED'
                : status === 429
                  ? 'RATE_LIMITED'
                  : 'INTERNAL_ERROR';
  const publicMessage = isOperational && typeof err?.publicMessage === 'string'
    ? err.publicMessage
    : status < 500
      ? 'The request could not be completed.'
      : 'An unexpected server error occurred.';

  logger.error('Unhandled API error', {
    err,
    requestId,
    method: req.method,
    path: req.originalUrl,
    status,
  });

  return failResponse(res, status, publicCode, publicMessage, requestId);
};
