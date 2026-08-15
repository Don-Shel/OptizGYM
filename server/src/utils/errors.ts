/**
 * Custom Error Classes for Registration and Authentication
 * These errors are caught by the errorHandler middleware
 */

/**
 * Validation Error - for input validation failures
 * Status: 400 Bad Request
 */
export class ValidationError extends Error {
  public status = 400;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Registration Error - for registration-specific failures
 * Status: 400 Bad Request
 */
export class RegistrationError extends Error {
  public status = 400;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'RegistrationError';
    this.details = details;
  }
}

/**
 * Transaction Rollback Error - for database transaction failures
 * Indicates that partial registration occurred and was rolled back
 * Status: 500 Internal Server Error
 */
export class TransactionRollbackError extends Error {
  public status = 500;
  public failureStage: string; // e.g., 'auth_user_creation', 'member_profile_creation'
  public details: any;

  constructor(message: string, failureStage: string, details?: any) {
    super(message);
    this.name = 'TransactionRollbackError';
    this.failureStage = failureStage;
    this.details = details;
  }
}

/**
 * Email Verification Error - for email verification failures
 * Status: 400 Bad Request
 */
export class EmailVerificationError extends Error {
  public status = 400;
  public reason: 'token_expired' | 'token_invalid' | 'user_not_found' | 'already_verified' | 'send_failed';
  public details: any;

  constructor(
    message: string,
    reason: 'token_expired' | 'token_invalid' | 'user_not_found' | 'already_verified' | 'send_failed',
    details?: any
  ) {
    super(message);
    this.name = 'EmailVerificationError';
    this.reason = reason;
    this.details = details;
  }
}

/**
 * Duplicate Member Error - for duplicate email registration attempts
 * Status: 409 Conflict
 */
export class DuplicateMemberError extends Error {
  public status = 409;
  public field: string; // e.g., 'email', 'username'
  public details: any;

  constructor(message: string, field: string, details?: any) {
    super(message);
    this.name = 'DuplicateMemberError';
    this.field = field;
    this.details = details;
  }
}

/**
 * Profile Consistency Error - for avatar ↔ member inconsistencies
 * Status: 409 Conflict or 500 depending on context
 */
export class ProfileConsistencyError extends Error {
  public status = 409;
  public inconsistencyType: 'orphaned_auth_user' | 'missing_member_profile' | 'verification_mismatch';
  public details: any;

  constructor(
    message: string,
    inconsistencyType: 'orphaned_auth_user' | 'missing_member_profile' | 'verification_mismatch',
    details?: any
  ) {
    super(message);
    this.name = 'ProfileConsistencyError';
    this.inconsistencyType = inconsistencyType;
    this.details = details;
  }
}

/**
 * Booking Error - for class booking failures
 * Status: 400 Bad Request
 */
export class BookingError extends Error {
  public status = 400;
  public reason: 'class_full' | 'already_booked' | 'eligibility_failed' | 'class_not_found' | 'booking_not_found' | 'booking_not_active';
  public details: any;

  constructor(
    message: string,
    reason: 'class_full' | 'already_booked' | 'eligibility_failed' | 'class_not_found' | 'booking_not_found' | 'booking_not_active',
    details?: any
  ) {
    super(message);
    this.name = 'BookingError';
    this.reason = reason;
    this.details = details;
  }
}

/**
 * Payment Error - for payment-specific failures
 * Status: 400 Bad Request
 */
export class PaymentError extends Error {
  public status: number;
  public reason: 'transaction_failed' | 'invalid_reference' | 'amount_mismatch' | 'unauthorized' | 'provider_unavailable' | 'provider_error';
  public details: any;

  constructor(
    message: string,
    reason: 'transaction_failed' | 'invalid_reference' | 'amount_mismatch' | 'unauthorized' | 'provider_unavailable' | 'provider_error',
    details?: any,
    status = 400
  ) {
    super(message);
    this.name = 'PaymentError';
    this.reason = reason;
    this.details = details;
    this.status = status;
  }
}

/**
 * Unauthorized Registration Error - for attempted registrations that violate policies
 * Status: 401 Unauthorized
 */
export class UnauthorizedRegistrationError extends Error {
  public status = 401;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'UnauthorizedRegistrationError';
    this.details = details;
  }
}
