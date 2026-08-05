import { Hono } from 'hono';
import { healthCheck, readinessCheck, livenessCheck } from './health.controller';

export const healthRoutes = new Hono();

// ─── Routes ────────────────────────────────────────────
healthRoutes.get('/', healthCheck);
healthRoutes.get('/readiness', readinessCheck);
healthRoutes.get('/liveness', livenessCheck);
