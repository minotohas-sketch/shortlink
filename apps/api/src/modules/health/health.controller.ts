import type { Context } from 'hono';
import { Logger } from '../../core/logger';
import { healthCheck as dbHealthCheck } from '../../core/db';

const logger = new Logger('HealthController');

// ─── Basic Health Check ────────────────────────────────
export async function healthCheck(c: Context): Promise<Response> {
  return c.json({
    status: 'ok',
    service: 'peage-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - (c.get('startTime') || Date.now()),
  });
}

// ─── Readiness Check (tous les services) ───────────────
export async function readinessCheck(c: Context): Promise<Response> {
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; message?: string }> = {};
  let allHealthy = true;
  
  // Check D1 Database
  try {
    const start = Date.now();
    const db = c.env?.D1;
    if (db) {
      await db.prepare('SELECT 1 as check_value').first();
      checks.database = { status: 'ok', latency: Date.now() - start };
    } else {
      checks.database = { status: 'error', message: 'D1 binding not found' };
      allHealthy = false;
    }
  } catch (error) {
    checks.database = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
    allHealthy = false;
  }
  
  // Check KV Cache
  try {
    const start = Date.now();
    const kv = c.env?.CACHE;
    if (kv) {
      await kv.get('health-check-readiness');
      checks.cache = { status: 'ok', latency: Date.now() - start };
    } else {
      checks.cache = { status: 'error', message: 'KV binding not found' };
      allHealthy = false;
    }
  } catch (error) {
    checks.cache = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
    allHealthy = false;
  }
  
  // Check R2 Storage
  try {
    const r2 = c.env?.STORAGE;
    if (r2) {
      checks.storage = { status: 'ok' };
    } else {
      checks.storage = { status: 'error', message: 'R2 binding not found' };
      allHealthy = false;
    }
  } catch (error) {
    checks.storage = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
    allHealthy = false;
  }
  
  // Check Queue
  try {
    const queue = c.env?.EMAIL_QUEUE;
    if (queue) {
      checks.queue = { status: 'ok' };
    } else {
      checks.queue = { status: 'error', message: 'Queue binding not found' };
      allHealthy = false;
    }
  } catch (error) {
    checks.queue = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
    allHealthy = false;
  }
  
  const statusCode = allHealthy ? 200 : 503;
  
  logger.info('Readiness check completed', { healthy: allHealthy, checks });
  
  return c.json({
    status: allHealthy ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  }, statusCode);
}

// ─── Liveness Check (juste si le worker tourne) ────────
export async function livenessCheck(c: Context): Promise<Response> {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}
