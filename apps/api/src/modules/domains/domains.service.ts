import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { domains } from '../links/links.schema';
import { eq, and, count } from 'drizzle-orm';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';

const logger = new Logger('DomainsService');

export async function addDomain(
  userId: string,
  domain: string
): Promise<any> {
  const db = getDb();
  
  // Nettoyer le domaine
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Vérifier le format
  if (!/^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(cleanDomain)) {
    throw new BadRequestError('Invalid domain format', 'INVALID_DOMAIN');
  }
  
  // Vérifier si déjà pris
  const existing = await db.select({ id: domains.id })
    .from(domains)
    .where(eq(domains.domain, cleanDomain))
    .get();
  
  if (existing) {
    throw new ConflictError('Domain already registered', 'DOMAIN_EXISTS');
  }
  
  // Vérifier le nombre de domaines
  const userDomains = await db.select({ total: count() })
    .from(domains)
    .where(eq(domains.userId, userId))
    .get();
  
  if (userDomains && userDomains.total >= 5) {
    throw new BadRequestError('Maximum 5 custom domains allowed', 'MAX_DOMAINS');
  }
  
  // Générer le token de vérification
  const verificationToken = generateUUID();
  
  const domainId = generateUUID();
  const now = nowISO();
  
  await (db.insert as any)(domains).values({
    id: domainId,
    userId,
    domain: cleanDomain,
    verified: false,
    verificationToken,
    verificationMethod: 'dns',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  
  logger.info('Domain added', { domainId, domain: cleanDomain, userId });
  
  return {
    domain: cleanDomain,
    verificationToken,
    record: `TXT peage-verify=${verificationToken}`,
  };
}

export async function verifyDomain(
  domainId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  
  const domain = await db.select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
    .get();
  
  if (!domain) {
    throw new NotFoundError('Domain not found', 'DOMAIN_NOT_FOUND');
  }
  
  // TODO: Vérifier réellement le DNS
  // Pour l'instant, on marque comme vérifié
  
  await (db.update as any)(domains)
    .set({ verified: true, status: 'active', updatedAt: nowISO() })
    .where(eq(domains.id, domainId));
  
  logger.info('Domain verified', { domainId, domain: domain.domain });
}

export async function deleteDomain(
  domainId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  
  const domain = await db.select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
    .get();
  
  if (!domain) {
    throw new NotFoundError('Domain not found', 'DOMAIN_NOT_FOUND');
  }
  
  await (db.delete as any)(domains).where(eq(domains.id, domainId));
  
  logger.info('Domain deleted', { domainId, domain: domain.domain });
}

export async function getDomains(userId: string): Promise<any[]> {
  const db = getDb();
  
  return db.select()
    .from(domains)
    .where(eq(domains.userId, userId))
    .all();
}
