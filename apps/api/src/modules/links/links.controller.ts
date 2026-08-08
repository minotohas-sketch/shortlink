import type { Context } from 'hono';
import { Logger } from '../../core/logger';
import { ok, created, noContent, paginated } from '../../utils/response';
import * as linksService from './links.service';
import type { CreateLinkInput, UpdateLinkInput, LinkQueryInput } from './links.types';

const logger = new Logger('LinksController');

export async function createLink(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const input = c.get('validatedBody') as CreateLinkInput;
  const link = await linksService.createLink(userId, input);
  return created(c, link, 'Link created successfully');
}

export async function getLink(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const linkId = c.req.param('id') || '';
  const link = await linksService.getLinkById(linkId, userId);
  return ok(c, link);
}

export async function updateLink(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const linkId = c.req.param('id') || '';
  const input = c.get('validatedBody') as UpdateLinkInput;
  const link = await linksService.updateLink(linkId, userId, input);
  return ok(c, link, 'Link updated successfully');
}

export async function deleteLink(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const linkId = c.req.param('id') || '';
  await linksService.deleteLink(linkId, userId);
  return noContent(c);
}

export async function listLinks(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const query = c.get('validatedQuery') as LinkQueryInput || { page: 1, limit: 20, order: 'desc' } as LinkQueryInput;
  const { links, meta } = await (linksService as any).listLinks(userId, query);
  return paginated(c, links, meta);
}

export async function redirectLink(c: Context): Promise<Response> {
  const shortCode = c.req.param('code') || '';
  try {
    const link = await linksService.getLinkByShortCode(shortCode);
    c.executionCtx?.waitUntil(linksService.incrementClickCount(link.id));
    return c.redirect(link.originalUrl, 302);
  } catch (error) {
    logger.error('Redirect failed', error, { shortCode });
    return c.redirect('https://shortlink-7qt.pages.dev/404', 302);
  }
}

export async function getLinkStats(c: Context): Promise<Response> {
  const userId = c.get('userId') as string;
  const linkId = c.req.param('id') || '';
  await linksService.getLinkById(linkId, userId);
  const stats = {
    totalClicks: 0, uniqueClicks: 0,
    clicksByCountry: {}, clicksByDevice: {}, clicksByBrowser: {},
    clicksByReferrer: {}, clicksByDate: {},
    averageCpm: 0, totalEarnings: 0,
  };
  return ok(c, stats);
}

export async function bulkCreateLinks(c: any): Promise<Response> {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const inputs = body.links || [];
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Links array is required' } }, 400);
  }
  if (inputs.length > 50) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Maximum 50 links per batch' } }, 400);
  }
  const results = [];
  const errors = [];
  for (let i = 0; i < inputs.length; i++) {
    try {
      const link = await linksService.createLink(userId, inputs[i]);
      results.push(link);
    } catch (error) {
      errors.push({ index: i, input: inputs[i], error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  return created(c, { created: results.length, failed: errors.length, links: results, errors: errors.length > 0 ? errors : undefined }, `Created ${results.length} links`);
}
