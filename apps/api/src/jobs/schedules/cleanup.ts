/**
 * Cleanup Scheduler
 * 
 * Nettoie les données expirées et optimise la base.
 * Exécuté tous les jours à 2h UTC.
 */

import { Logger } from '../../core/logger';
import { getDb } from '../../core/db';
import { links } from '../../modules/links/links.schema';
import { sessions } from '../../modules/auth/auth.schema';
import { emailVerifications, passwordResets } from '../../modules/auth/auth.schema';
import { lt, and, eq } from 'drizzle-orm';
import { nowISO } from '../../utils/date';

const logger = new Logger('Cleanup');

export async function runCleanup(env: any): Promise<void> {
  logger.info('Starting cleanup task');
  
  const db = getDb();
  const now = nowISO();
  
  try {
    // 1. Marquer les liens expirés
    const expiredLinks = await (db.update as any)(links)
      .set({ status: 'expired', updatedAt: now })
      .where(
        and(
          eq(links.status, 'active'),
          lt(links.expiresAt, now)
        )
      )
      .returning({ id: links.id });
    
    logger.info('Expired links updated', { count: expiredLinks.length });
    
    // 2. Supprimer les sessions expirées
    const deletedSessions = await (db.delete as any)(sessions)
      .where(lt(sessions.expiresAt, now))
      .returning({ id: sessions.id });
    
    logger.info('Expired sessions deleted', { count: deletedSessions.length });
    
    // 3. Supprimer les vérifications d'email expirées
    const deletedVerifications = await (db.delete as any)(emailVerifications)
      .where(lt(emailVerifications.expiresAt, now))
      .returning({ id: emailVerifications.id });
    
    logger.info('Expired email verifications deleted', { count: deletedVerifications.length });
    
    // 4. Supprimer les resets de mot de passe expirés
    const deletedResets = await (db.delete as any)(passwordResets)
      .where(lt(passwordResets.expiresAt, now))
      .returning({ id: passwordResets.id });
    
    logger.info('Expired password resets deleted', { count: deletedResets.length });
    
    // 5. Supprimer les liens supprimés (soft delete) de plus de 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    
    const deletedLinks = await (db.delete as any)(links)
      .where(
        and(
          eq(links.status, 'deleted'),
          lt(links.updatedAt, thirtyDaysAgo)
        )
      )
      .returning({ id: links.id });
    
    logger.info('Old deleted links purged', { count: deletedLinks.length });
    
    logger.info('Cleanup completed', {
      expiredLinks: expiredLinks.length,
      deletedSessions: deletedSessions.length,
      deletedVerifications: deletedVerifications.length,
      deletedResets: deletedResets.length,
      deletedLinks: deletedLinks.length,
    });
  } catch (error) {
    logger.error('Cleanup failed', error);
  }
}
