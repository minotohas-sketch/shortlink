import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { Logger } from '../core/logger';
import { Environment } from '../core/env';
import {
  AppError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
} from '../utils/errors';

const logger = new Logger('ErrorHandler');

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp?: string;
    stack?: string;
  };
}

export async function errorHandler(err: Error, c: Context): Promise<Response> {
  const requestId = c.get('requestId') || 'unknown';
  const timestamp = new Date().toISOString();
  
  // ─── AppError (notre erreur métier) ──────────────────
  if (err instanceof AppError) {
    const statusCode = err.statusCode as StatusCode;
    
    // Logging selon sévérité
    if (statusCode >= 500) {
      logger.error(`[${requestId}] ${err.code}: ${err.message}`, err);
    } else {
      logger.warn(`[${requestId}] ${err.code}: ${err.message}`, {
        statusCode,
        details: err.details,
      });
    }
    
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
        timestamp,
      },
    };
    
    // Stack trace en dev seulement
    if (Environment.isDevelopment && err.stack) {
      body.error.stack = err.stack;
    }
    
    // Headers spéciaux pour rate limiting
    if (err instanceof TooManyRequestsError) {
      const retryAfter = (err.details as any)?.retryAfter || 60;
      c.header('Retry-After', String(retryAfter));
    }
    
    return c.json(body, statusCode as any);
  }
  
  // ─── Validation Error (Zod, etc.) ────────────────────
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const fieldErrors: Record<string, string[]> = {};
    
    for (const issue of zodError.issues || []) {
      const path = issue.path.join('.') || '_global';
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    
    const validationError = new ValidationError(fieldErrors);
    
    logger.warn(`[${requestId}] Validation failed`, { fieldErrors });
    
    return c.json(validationError.toJSON(), 400);
  }
  
  // ─── Erreur inattendue ───────────────────────────────
  logger.error(`[${requestId}] Unhandled error: ${err.message}`, err, {
    name: err.name,
    stack: err.stack,
  });
  
  const internalError = new InternalServerError(
    Environment.isProduction
      ? 'An unexpected error occurred'
      : err.message,
    'INTERNAL_ERROR',
    Environment.isDevelopment ? { stack: err.stack } : undefined
  );
  
  const body = internalError.toJSON() as ErrorResponse;
  body.error.requestId = requestId;
  body.error.timestamp = timestamp;
  
  return c.json(body, 500);
}

// ─── Helper ho an'ny try/catch ─────────────────────────
export function asyncHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context): Promise<Response> => {
    try {
      return await fn(c);
    } catch (err) {
      return errorHandler(err as Error, c);
    }
  };
}
