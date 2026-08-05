import { Hono } from 'hono';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createLinkRateLimiter } from '../../middleware/rate-limit';
import {
  createLinkSchema,
  updateLinkSchema,
  linkQuerySchema,
} from './links.types';
import {
  createLink,
  getLink,
  updateLink,
  deleteLink,
  listLinks,
  redirectLink,
  getLinkStats,
  bulkCreateLinks,
} from './links.controller';

export const linksRoutes = new Hono();

// ─── Public Routes ─────────────────────────────────────
// Redirection (pas d'auth requise)
linksRoutes.get('/:code', redirectLink);

// ─── Protected Routes ──────────────────────────────────
linksRoutes.post(
  '/',
  requireAuth,
  createLinkRateLimiter,
  validate({ body: createLinkSchema }),
  createLink
);

linksRoutes.post(
  '/bulk',
  requireAuth,
  createLinkRateLimiter,
  bulkCreateLinks
);

linksRoutes.get(
  '/',
  requireAuth,
  validate({ query: linkQuerySchema }),
  listLinks
);

linksRoutes.get(
  '/:id',
  requireAuth,
  getLink
);

linksRoutes.patch(
  '/:id',
  requireAuth,
  validate({ body: updateLinkSchema }),
  updateLink
);

linksRoutes.delete(
  '/:id',
  requireAuth,
  deleteLink
);

linksRoutes.get(
  '/:id/stats',
  requireAuth,
  getLinkStats
);
