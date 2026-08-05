import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { links, clicks } from './links.schema';
import { eq, and, like, desc, asc, count, or, lt, sql } from 'drizzle-orm';
import type { CreateLinkInput, UpdateLinkInput, LinkQueryInput } from './links.types';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors';
import { validateAndSanitizeUrl, buildShortUrl, generateShortCode } from '../../utils/url';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';
import { createPaginationMeta, calculateOffset } from '../../utils/pagination';

const logger = new Logger('LinksService');

export async function createLink(userId: string, input: CreateLinkInput): Promise<any> {
  const db = getDb();
  const originalUrl = validateAndSanitizeUrl(input.originalUrl);
  let shortCode = input.shortCode;
  
  if (shortCode) {
    const existing = await db.select({ id: links.id }).from(links).where(eq(links.shortCode, shortCode)).get();
    if (existing) throw new ConflictError(`Short code '${shortCode}' is already taken`, 'SHORT_CODE_TAKEN');
  } else {
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      const existing = await db.select({ id: links.id }).from(links).where(eq(links.shortCode, shortCode)).get();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    if (attempts >= 10) throw new Error('Failed to generate unique short code');
  }
  
  const now = nowISO();
  const linkId = generateUUID();
  
  await (db.insert as any)(links).values({
    id: linkId, userId, shortCode, originalUrl,
    title: input.title || null, description: input.description || null,
    tags: input.tags || null, password: input.password || null,
    expiresAt: input.expiresAt || null, maxClicks: input.maxClicks || null,
    domainId: input.domainId || null,
    utmSource: input.utmSource || null, utmMedium: input.utmMedium || null,
    utmCampaign: input.utmCampaign || null,
    status: 'active', createdAt: now, updatedAt: now,
  });
  
  const link = await db.select().from(links).where(eq(links.id, linkId)).get();
  if (!link) throw new Error('Failed to create link');
  logger.info('Link created', { linkId, shortCode, userId });
  return toLinkResponse(link as any);
}

export async function getLinkById(linkId: string, userId?: string): Promise<any> {
  const db = getDb();
  const conditions: any[] = [eq(links.id, linkId)];
  if (userId) conditions.push(eq(links.userId, userId));
  
  const link = await db.select().from(links).where(and(...conditions)).get();
  if (!link) throw new NotFoundError('Link not found', 'LINK_NOT_FOUND');
  return toLinkResponse(link as any);
}

export async function getLinkByShortCode(shortCode: string): Promise<any> {
  const db = getDb();
  const link = await db.select().from(links).where(eq(links.shortCode, shortCode)).get();
  if (!link) throw new NotFoundError('Link not found', 'LINK_NOT_FOUND');
  if (link.status === 'deleted') throw new NotFoundError('Link not found', 'LINK_NOT_FOUND');
  if (link.status === 'inactive') throw new ForbiddenError('Link is disabled', 'LINK_DISABLED');
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    await (db.update as any)(links).set({ status: 'expired', updatedAt: nowISO() }).where(eq(links.id, link.id));
    throw new ForbiddenError('Link has expired', 'LINK_EXPIRED');
  }
  if (link.maxClicks && link.currentClicks >= link.maxClicks) {
    throw new ForbiddenError('Link has reached maximum clicks', 'LINK_MAX_CLICKS');
  }
  return link as any;
}

export async function updateLink(linkId: string, userId: string, input: UpdateLinkInput): Promise<any> {
  const db = getDb();
  const existing = await db.select().from(links).where(and(eq(links.id, linkId), eq(links.userId, userId))).get();
  if (!existing) throw new NotFoundError('Link not found', 'LINK_NOT_FOUND');
  
  if (input.originalUrl) input.originalUrl = validateAndSanitizeUrl(input.originalUrl);
  
  const updateData: any = { updatedAt: nowISO() };
  if (input.originalUrl !== undefined) updateData.originalUrl = input.originalUrl;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.password !== undefined) updateData.password = input.password;
  if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt;
  if (input.maxClicks !== undefined) updateData.maxClicks = input.maxClicks;
  
  await (db.update as any)(links).set(updateData).where(eq(links.id, linkId));
  const updated = await db.select().from(links).where(eq(links.id, linkId)).get();
  if (!updated) throw new Error('Failed to update link');
  logger.info('Link updated', { linkId, userId });
  return toLinkResponse(updated as any);
}

export async function deleteLink(linkId: string, userId: string): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(links).where(and(eq(links.id, linkId), eq(links.userId, userId))).get();
  if (!existing) throw new NotFoundError('Link not found', 'LINK_NOT_FOUND');
  
  await (db.update as any)(links).set({ status: 'deleted', updatedAt: nowISO() }).where(eq(links.id, linkId));
  logger.info('Link deleted', { linkId, userId });
}

export async function listLinks(userId: string, query: LinkQueryInput): Promise<{ links: any[]; meta: any }> {
  const db = getDb();
  const conditions: any[] = [eq(links.userId, userId)];
  if (query.status) conditions.push(eq(links.status, query.status as any));
  if (query.search) {
    conditions.push(or(like(links.title, `%${query.search}%`), like(links.originalUrl, `%${query.search}%`)));
  }
  
  const totalResult = await db.select({ total: count() }).from(links).where(and(...conditions)).get();
  const total = (totalResult?.total as number) ?? 0;
  const offset = calculateOffset(query.page, query.limit);
  
  const results = await db.select().from(links).where(and(...conditions))
    .limit(query.limit).offset(offset).all();
  
  const meta = createPaginationMeta(query.page, query.limit, total);
  return { links: results.map((r: any) => toLinkResponse(r)), meta };
}

export async function incrementClickCount(linkId: string): Promise<void> {
  const db = getDb();
  await (db.update as any)(links).set({ currentClicks: sql`current_clicks + 1`, updatedAt: nowISO() }).where(eq(links.id, linkId));
}

function toLinkResponse(link: any): any {
  return {
    id: link.id, shortCode: link.shortCode,
    shortUrl: buildShortUrl(link.shortCode, link.customDomain || undefined),
    originalUrl: link.originalUrl, title: link.title, description: link.description,
    tags: link.tags, status: link.status, password: link.password ? '***' : null,
    expiresAt: link.expiresAt, maxClicks: link.maxClicks, currentClicks: link.currentClicks,
    domainId: link.domainId, customDomain: link.customDomain,
    utmSource: link.utmSource, utmMedium: link.utmMedium, utmCampaign: link.utmCampaign,
    createdAt: link.createdAt, updatedAt: link.updatedAt,
  };
}
