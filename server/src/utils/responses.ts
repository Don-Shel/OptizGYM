import type { Response } from 'express';
import logger from './logger';

export type PublicError = {
  code: string;
  message: string;
};

export const successResponse = (res: Response, data: unknown, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

const statusCodeFor = (status: number) => {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_FAILED';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 502 || status === 503 || status === 504) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
};

const PUBLIC_REASON_MESSAGES: Record<string, string> = {
  class_full: 'This class is currently full.',
  already_booked: 'You already have a booking for this class.',
  eligibility_failed: 'Your membership is not eligible for this class.',
  class_not_found: 'The requested class was not found.',
  booking_not_found: 'The requested booking was not found.',
  booking_not_active: 'This booking is no longer active.',
  transaction_failed: 'The payment could not be completed.',
  invalid_reference: 'The payment reference is invalid.',
  amount_mismatch: 'The payment amount does not match the selected plan.',
  unauthorized: 'You are not authorized to complete this payment.',
  provider_unavailable: 'The payment service is temporarily unavailable.',
  provider_error: 'The payment service could not complete the request.',
};

const reasonFromDetails = (details: unknown) => {
  if (!details || typeof details !== 'object' || !('reason' in details)) return undefined;
  const reason = (details as { reason?: unknown }).reason;
  return typeof reason === 'string' ? reason : undefined;
};

const codeFromDetails = (details: unknown, status: number) => {
  if (details && typeof details === 'object' && 'reason' in details) {
    const reason = (details as { reason?: unknown }).reason;
    if (typeof reason === 'string' && /^[a-z0-9_-]+$/i.test(reason)) {
      return reason.replace(/-/g, '_').toUpperCase();
    }
  }
  return statusCodeFor(status);
};

/**
 * Compatibility wrapper for existing controllers.
 * `details` is intentionally ignored and must never be serialized to clients.
 * Unexpected 5xx messages are replaced with a generic public message.
 */
export const errorResponse = (
  res: Response,
  message: string,
  status = 500,
  details?: unknown,
) => {
  const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
  const isServerFailure = safeStatus >= 500;
  if (details instanceof Error || (isServerFailure && details !== undefined)) {
    logger.error('Controller error', { error: details });
  }
  const reason = reasonFromDetails(details);
  const safeMessage = isServerFailure
    ? 'An unexpected server error occurred.'
    : (reason ? PUBLIC_REASON_MESSAGES[reason] : undefined) || message;
  return res.status(safeStatus).json({
    success: false,
    error: {
      code: codeFromDetails(details, safeStatus),
      message: safeMessage,
    } satisfies PublicError,
  });
};

export const failResponse = (
  res: Response,
  status: number,
  code: string,
  message: string,
  requestId?: string,
) => {
  const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
  return res.status(safeStatus).json({
    success: false,
    error: {
      code,
      message: safeStatus >= 500 ? 'An unexpected server error occurred.' : message,
      ...(requestId ? { requestId } : {}),
    },
  });
};
