import type { Context, Next } from 'hono';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';
import { Logger } from '../core/logger';

const logger = new Logger('Validation');

type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export function validate(schemas: ValidationConfig) {
  return async (c: Context, next: Next): Promise<void> => {
    const errors: Record<string, string[]> = {};
    
    try {
      // Valider le body
      if (schemas.body) {
        const body = await c.req.json().catch(() => ({}));
        const parsed = schemas.body.parse(body);
        c.set('validatedBody', parsed);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        mergeZodErrors(errors, 'body', error);
      } else {
        errors.body = ['Invalid JSON body'];
      }
    }
    
    try {
      // Valider les query params
      if (schemas.query) {
        const query = Object.fromEntries(
          Object.entries(c.req.queries()).map(([key, val]) => [
            key,
            Array.isArray(val) && val.length === 1 ? val[0] : val,
          ])
        );
        const parsed = schemas.query.parse(query);
        c.set('validatedQuery', parsed);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        mergeZodErrors(errors, 'query', error);
      }
    }
    
    try {
      // Valider les params d'URL
      if (schemas.params) {
        const params = c.req.param();
        const parsed = schemas.params.parse(params);
        c.set('validatedParams', parsed);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        mergeZodErrors(errors, 'params', error);
      }
    }
    
    try {
      // Valider les headers
      if (schemas.headers) {
        const headers = Object.fromEntries(c.req.raw.headers.entries());
        const parsed = schemas.headers.parse(headers);
        c.set('validatedHeaders', parsed);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        mergeZodErrors(errors, 'headers', error);
      }
    }
    
    // Si des erreurs, on throw
    if (Object.keys(errors).length > 0) {
      logger.warn('Validation failed', { errors });
      throw new ValidationError(errors);
    }
    
    await next();
  };
}

// ─── Helpers ───────────────────────────────────────────
function mergeZodErrors(
  target: Record<string, string[]>,
  source: string,
  error: ZodError
): void {
  for (const issue of error.issues) {
    const path = issue.path.length > 0 
      ? `${source}.${issue.path.join('.')}` 
      : source;
    
    if (!target[path]) {
      target[path] = [];
    }
    target[path].push(issue.message);
  }
}

// ─── Helpers getter (typed) ────────────────────────────
export function getValidatedBody<T = unknown>(c: Context): T {
  return c.get('validatedBody') as T;
}

export function getValidatedQuery<T = unknown>(c: Context): T {
  return c.get('validatedQuery') as T;
}

export function getValidatedParams<T = unknown>(c: Context): T {
  return c.get('validatedParams') as T;
}

// ─── Schemas communs ───────────────────────────────────
export const commonSchemas = {
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  id: z.object({
    id: z.string().uuid(),
  }),
  
  shortCode: z.object({
    code: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  }),
  
  email: z.object({
    email: z.string().email().max(255),
  }),
  
  password: z.object({
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  }),
};

// ─── Middleware simplifié pour un seul schéma body ─────
export function validateBody<T extends ZodSchema>(schema: T) {
  return validate({ body: schema });
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return validate({ query: schema });
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return validate({ params: schema });
}
