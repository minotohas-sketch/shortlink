import type { Context, Next } from 'hono';
import { getSecurityService } from '../core/security';
import { Logger } from '../core/logger';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

const logger = new Logger('AuthMiddleware');
const security = getSecurityService();

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  iat: number;
  exp: number;
}

export type AuthUser = JwtPayload;

export async function requireAuth(c: Context, next: Next): Promise<void> {
  const token = extractToken(c);
  if (!token) throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
  
  const payload = await security.verifyJWT(token);
  if (!payload) throw new UnauthorizedError('Invalid or expired token', 'TOKEN_INVALID');
  
  const user = payload as unknown as JwtPayload;
  
  c.set('user', user);
  c.set('userId', user.sub);
  c.set('userRole', user.role);
  
  logger.debug('User authenticated', { userId: user.sub, role: user.role });
  await next();
}

export async function optionalAuth(c: Context, next: Next): Promise<void> {
  const token = extractToken(c);
  if (token) {
    const payload = await security.verifyJWT(token);
    if (payload) {
      const user = payload as unknown as JwtPayload;
      c.set('user', user);
      c.set('userId', user.sub);
      c.set('userRole', user.role);
    }
  }
  await next();
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next): Promise<void> => {
    const user = c.get('user') as AuthUser | undefined;
    if (!user) throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
    if (!roles.includes(user.role)) {
      logger.warn('Access denied', { userId: user.sub, userRole: user.role, requiredRoles: roles });
      throw new ForbiddenError('Insufficient permissions', 'INSUFFICIENT_ROLE');
    }
    await next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireStaff = requireRole('admin', 'moderator');

export async function requireApiKey(c: Context, next: Next): Promise<void> {
  const apiKey = c.req.header('X-API-Key') || c.req.query('api_key');
  if (!apiKey) throw new UnauthorizedError('API key required', 'API_KEY_REQUIRED');
  if (apiKey.length < 32) throw new UnauthorizedError('Invalid API key', 'API_KEY_INVALID');
  c.set('apiKey', apiKey);
  c.set('isApiKey', true);
  await next();
}

function extractToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  const cookieHeader = c.req.header('Cookie') || '';
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) return match[1]!;
  return c.req.query('token') ?? null;
}

export function getCurrentUser(c: Context): AuthUser | null {
  return c.get('user') || null;
}

export function getCurrentUserId(c: Context): string | null {
  return c.get('userId') || null;
}
