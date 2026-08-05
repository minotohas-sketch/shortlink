/**
 * Hiérarchie d'erreurs structurée pour l'application
 */

// ─── Base Error ─────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  
  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// ─── HTTP Errors ────────────────────────────────────────
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: unknown) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details?: unknown) {
    super(message, 403, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', code = 'NOT_FOUND', details?: unknown) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: unknown) {
    super(message, 409, code, details);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Gone', code = 'GONE', details?: unknown) {
    super(message, 410, code, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity', code = 'UNPROCESSABLE_ENTITY', details?: unknown) {
    super(message, 422, code, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Too Many Requests',
    code = 'TOO_MANY_REQUESTS',
    retryAfter?: number,
    details?: unknown
  ) {
    super(message, 429, code, { ...(details as object), retryAfter });
  }
}

export class InternalServerError extends AppError {
  constructor(
    message = 'Internal Server Error',
    code = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message, 500, code, details, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Service Unavailable',
    code = 'SERVICE_UNAVAILABLE',
    details?: unknown
  ) {
    super(message, 503, code, details);
  }
}

// ─── Validation Error ───────────────────────────────────
export class ValidationError extends BadRequestError {
  public readonly fieldErrors: Record<string, string[]>;
  
  constructor(fieldErrors: Record<string, string[]>, message = 'Validation Error') {
    super(message, 'VALIDATION_ERROR', { fieldErrors });
    this.fieldErrors = fieldErrors;
  }
  
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: { fieldErrors: this.fieldErrors },
      },
    };
  }
}

// ─── Domain-Specific Errors ─────────────────────────────
export class AuthError extends UnauthorizedError {
  constructor(message = 'Authentication failed', code = 'AUTH_FAILED', details?: unknown) {
    super(message, code, details);
  }
}

export class EmailNotVerifiedError extends ForbiddenError {
  constructor(message = 'Email not verified', code = 'EMAIL_NOT_VERIFIED') {
    super(message, code);
  }
}

export class AccountSuspendedError extends ForbiddenError {
  constructor(message = 'Account suspended', code = 'ACCOUNT_SUSPENDED') {
    super(message, code);
  }
}

export class InsufficientBalanceError extends BadRequestError {
  constructor(required: number, current: number) {
    super(
      `Insufficient balance. Required: $${required.toFixed(2)}, Current: $${current.toFixed(2)}`,
      'INSUFFICIENT_BALANCE',
      { required, current }
    );
  }
}

export class LinkExpiredError extends GoneError {
  constructor(code: string) {
    super(`Link with code '${code}' has expired`, 'LINK_EXPIRED', { code });
  }
}

export class LinkDisabledError extends ForbiddenError {
  constructor(code: string) {
    super(`Link with code '${code}' is disabled`, 'LINK_DISABLED', { code });
  }
}

export class ShortCodeTakenError extends ConflictError {
  constructor(code: string) {
    super(`Short code '${code}' is already taken`, 'SHORT_CODE_TAKEN', { code });
  }
}

export class InvalidDomainError extends BadRequestError {
  constructor(domain: string) {
    super(`Domain '${domain}' is not valid or not verified`, 'INVALID_DOMAIN', { domain });
  }
}

export class WithdrawalLimitError extends BadRequestError {
  constructor(min: number, max: number) {
    super(
      `Withdrawal amount must be between $${min.toFixed(2)} and $${max.toFixed(2)}`,
      'WITHDRAWAL_LIMIT_ERROR',
      { min, max }
    );
  }
}

// ─── Error Codes ────────────────────────────────────────
export const ErrorCodes = {
  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Links
  SHORT_CODE_TAKEN: 'SHORT_CODE_TAKEN',
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  LINK_EXPIRED: 'LINK_EXPIRED',
  LINK_DISABLED: 'LINK_DISABLED',
  INVALID_URL: 'INVALID_URL',
  
  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Payments
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  WITHDRAWAL_LIMIT_ERROR: 'WITHDRAWAL_LIMIT_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // General
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
