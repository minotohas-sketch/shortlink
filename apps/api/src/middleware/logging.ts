import type { Context, Next } from 'hono';
import { Logger } from '../core/logger';
import { getSecurityService } from '../core/security';

const logger = new Logger('HTTP');
const security = getSecurityService();

// ─── Request ID Middleware ─────────────────────────────
export async function requestIdMiddleware(c: Context, next: Next): Promise<void> {
  const existingId = c.req.header('X-Request-Id');
  const requestId = existingId || security.generateId();
  
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  
  await next();
}

// ─── Request Logging Middleware ────────────────────────
export async function requestLogging(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const requestId = c.get('requestId') || 'unknown';
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('User-Agent')?.substring(0, 200);
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  
  logger.info(`${method} ${path}`, {
    requestId,
    method,
    path,
    ip,
    userAgent,
  });
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  const logData = {
    requestId,
    method,
    path,
    status,
    duration,
    userId: c.get('userId'),
  };
  
  if (status >= 500) {
    logger.error(`${method} ${path} ${status} ${duration}ms`, undefined, logData);
  } else if (status >= 400) {
    logger.warn(`${method} ${path} ${status} ${duration}ms`, logData);
  } else {
    logger.info(`${method} ${path} ${status} ${duration}ms`, logData);
  }
}

// ─── Audit Logging Middleware ──────────────────────────
export interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  ip?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function auditLog(c: Context, entry: AuditEntry): Promise<void> {
  const requestId = c.get('requestId') || 'unknown';
  const userId = c.get('userId');
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  const userAgent = c.req.header('User-Agent');
  
  const auditEntry = {
    ...entry,
    requestId,
    userId: entry.userId || userId,
    ip: entry.ip || ip,
    userAgent,
    timestamp: new Date().toISOString(),
  };
  
  logger.info(`AUDIT: ${entry.action} ${entry.resource}`, auditEntry);
  
  // TODO: Enregistrer dans une table d'audit
  // await db.insert(auditLogs).values(auditEntry);
}

// ─── Helper: Créer un audit log pour les modifications ─
export function createAuditMiddleware(action: string, resource: string) {
  return async (c: Context, next: Next): Promise<void> => {
    await next();
    
    if (c.res.status >= 200 && c.res.status < 300) {
      const resourceId = c.req.param('id') || c.req.param('code');
      
      await auditLog(c, {
        action,
        resource,
        resourceId,
      });
    }
  };
}
