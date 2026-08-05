import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { timeout } from 'hono/timeout';
import { Environment } from './env';
import { errorHandler } from '../middleware/error';
import { requestIdMiddleware } from '../middleware/logging';
import { rateLimiter } from '../middleware/rate-limit';
import { Logger } from './logger';
import type { Context } from 'hono';

const logger = new Logger('App');

export function createApp() {
  const app = new Hono();
  const env = Environment.get();
  
  app.use('*', requestIdMiddleware);
  
  app.use('*', secureHeaders());
  
  app.use('*', cors({
    origin: env.CORS_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
    credentials: true,
  }));
  
  app.use('*', timeout(30000));
  
  if (Environment.isDevelopment) {
    const { logger: honoLogger } = require('hono/logger');
    app.use('*', honoLogger());
  }
  
  app.use('*', prettyJSON());
  
  app.use('*', rateLimiter({
    windowMs: 60000,
    max: env.RATE_LIMIT_GLOBAL,
    keyGenerator: (c: Context) => {
      const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
      return `global:${ip}`;
    },
  }));
  
  app.get('/health', (c: Context) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.APP_ENV, version: '1.0.0' });
  });
  
  app.get('/health/readiness', async (c: Context) => {
    const checks: Record<string, boolean> = {};
    const envBindings = c.env as any || {};
    
    try {
      if (envBindings.D1) {
        await envBindings.D1.prepare('SELECT 1').first();
        checks.database = true;
      } else { checks.database = false; }
    } catch { checks.database = false; }
    
    try {
      if (envBindings.CACHE) {
        await envBindings.CACHE.get('health-check');
        checks.cache = true;
      } else { checks.cache = false; }
    } catch { checks.cache = false; }
    
    const allHealthy = Object.values(checks).every(v => v);
    return c.json({ status: allHealthy ? 'ready' : 'not_ready', checks, timestamp: new Date().toISOString() }, allHealthy ? 200 : (503 as any));
  });
  
  app.onError(errorHandler);
  
  app.notFound((c: Context) => {
    return c.json({ error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} not found` } }, 404);
  });
  
  logger.info('Application created successfully');
  return app;
}

export type AppType = ReturnType<typeof createApp>;
