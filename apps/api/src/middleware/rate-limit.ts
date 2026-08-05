import type { Context, Next } from 'hono';
import { Environment } from '../core/env';
import { Logger } from '../core/logger';
import { TooManyRequestsError } from '../utils/errors';

const logger = new Logger('RateLimit');

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
  skipFailed?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator, skipFailed } = options;
  
  return async (c: Context, next: Next): Promise<void> => {
    const key = keyGenerator 
      ? keyGenerator(c) 
      : c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    const now = Date.now();
    
    // Essayer de récupérer depuis KV
    let entry: RateLimitEntry;
    
    try {
      const kv = c.env?.RATE_LIMIT_KV;
      if (kv) {
        const stored = await kv.get(`ratelimit:${key}`, 'json');
        
        if (stored && (stored as RateLimitEntry).resetAt > now) {
          entry = stored as RateLimitEntry;
        } else {
          entry = { count: 0, resetAt: now + windowMs };
        }
      } else {
        // Fallback: stockage local (non partagé entre workers)
        entry = getLocalEntry(key, now, windowMs);
      }
    } catch (error) {
      logger.error('Rate limit KV error', error);
      // En cas d'erreur KV, on laisse passer
      return await next();
    }
    
    // Incrémenter
    entry.count++;
    
    // Calculer les headers
    const remaining = Math.max(0, max - entry.count);
    const reset = Math.ceil(entry.resetAt / 1000);
    
    // Toujours ajouter les headers
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(reset));
    
    // Vérifier si la limite est dépassée
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      
      logger.warn('Rate limit exceeded', { key, count: entry.count, max, remaining });
      
      throw new TooManyRequestsError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        retryAfter
      );
    }
    
    // Sauvegarder dans KV
    try {
      const kv = c.env?.RATE_LIMIT_KV;
      if (kv) {
        await kv.put(`ratelimit:${key}`, JSON.stringify(entry), {
          expirationTtl: Math.ceil(windowMs / 1000),
        });
      }
    } catch (error) {
      logger.error('Rate limit KV save error', error);
      // Continue même si la sauvegarde échoue
    }
    
    await next();
  };
}

// ─── Stockage local (fallback) ─────────────────────────
const localStore = new Map<string, RateLimitEntry>();

function getLocalEntry(key: string, now: number, windowMs: number): RateLimitEntry {
  const existing = localStore.get(key);
  
  if (existing && existing.resetAt > now) {
    return existing;
  }
  
  const newEntry: RateLimitEntry = { count: 0, resetAt: now + windowMs };
  localStore.set(key, newEntry);
  
  // Nettoyage périodique
  if (localStore.size > 10000) {
    const expiredKeys: string[] = [];
    localStore.forEach((entry, k) => {
      if (entry.resetAt <= now) expiredKeys.push(k);
    });
    expiredKeys.forEach(k => localStore.delete(k));
  }
  
  return newEntry;
}

// ─── Rate limiters préconfigurés ───────────────────────
export const authRateLimiter = rateLimiter({
  windowMs: 60000,
  max: Environment.get().RATE_LIMIT_AUTH,
  keyGenerator: (c) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    return `auth:${ip}`;
  },
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60000,
  max: (Environment.get() as any).RATE_LIMIT_API || 100,
  keyGenerator: (c) => {
    const userId = c.get('userId');
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    return userId ? `api:${userId}` : `api:${ip}`;
  },
});

export const createLinkRateLimiter = rateLimiter({
  windowMs: 60000,
  max: 30,
  keyGenerator: (c) => {
    const userId = c.get('userId');
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    return `create-link:${userId || ip}`;
  },
});
