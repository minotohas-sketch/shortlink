/**
 * Analytics Queue Worker
 * 
 * Traite les événements de clic et les enregistre en base.
 * Calcul les earnings et les commissions de parrainage.
 */

import { Logger } from '../../core/logger';
import { getDb } from '../../core/db';
import { clicks, links } from '../../modules/links/links.schema';
import { earnings } from '../../modules/earnings/earnings.service';
import { eq, and, count, sql } from 'drizzle-orm';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';
import { getCpmRate } from '../../utils/geo';

const logger = new Logger('AnalyticsWorker');

export interface ClickEvent {
  linkId: string;
  shortCode: string;
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  device: string;
  deviceType: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  referrer: string;
  referrerDomain: string;
  userAgent: string;
  language: string;
  screenResolution: string;
  uniqueHash: string;
}

export async function processAnalyticsBatch(
  batch: MessageBatch<ClickEvent>
): Promise<void> {
  const db = getDb();
  
  logger.info('Processing analytics batch', { count: batch.messages.length });
  
  for (const message of batch.messages) {
    try {
      const event = message.body;
      
      // Vérifier si c'est un clic unique (24h)
      const recentClick = await db.select({ id: clicks.id })
        .from(clicks)
        .where(
          and(
            eq(clicks.linkId, event.linkId),
            eq(clicks.uniqueHash, event.uniqueHash),
            sql`${clicks.createdAt} > datetime('now', '-24 hours')`
          )
        )
        .get();
      
      const isUnique = !recentClick;
      
      // Calculer le CPM
      const cpmRate = getCpmRate(event.countryCode);
      const earningsAmount = cpmRate / 1000;
      
      // Insérer le clic
      await (db.insert as any)(clicks).values({
        id: generateUUID(),
        linkId: event.linkId,
        ipAddress: event.ip,
        country: event.country,
        countryCode: event.countryCode,
        city: event.city,
        region: event.region,
        continent: event.continent,
        latitude: event.latitude,
        longitude: event.longitude,
        timezone: event.timezone,
        device: event.device,
        deviceType: event.deviceType as any,
        browser: event.browser,
        browserVersion: event.browserVersion,
        os: event.os,
        osVersion: event.osVersion,
        referrer: event.referrer,
        referrerDomain: event.referrerDomain,
        userAgent: event.userAgent,
        language: event.language,
        screenResolution: event.screenResolution,
        uniqueHash: event.uniqueHash,
        isUnique,
        cpmRate,
        earnings: earningsAmount,
        createdAt: event.timestamp,
      });
      
      // Mettre à jour le compteur du lien
      await (db.update as any)(links)
        .set({ currentClicks: sql`current_clicks + 1` })
        .where(eq(links.id, event.linkId));
      
      // Si clic unique, ajouter aux earnings
      if (isUnique) {
        const link = await db.select({ userId: links.userId })
          .from(links)
          .where(eq(links.id, event.linkId))
          .get();
        
        if (link) {
          await (db.insert as any)(earnings).values({
            id: generateUUID(),
            userId: link.userId,
            amount: earningsAmount,
            source: 'click',
            linkId: event.linkId,
            status: 'approved',
            createdAt: nowISO(),
          });
          
          // TODO: Vérifier et ajouter commission de parrainage
        }
      }
      
      message.ack();
      logger.debug('Click processed', { linkId: event.linkId, isUnique });
    } catch (error) {
      logger.error('Analytics processing error', error);
      message.retry({ delaySeconds: 30 });
    }
  }
}

export default {
  async queue(batch: MessageBatch<ClickEvent>, env: any): Promise<void> {
    await processAnalyticsBatch(batch);
  },
};
