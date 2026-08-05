/**
 * Click Event Processor
 * 
 * Traite un événement de clic individuel.
 */

import { Logger } from './logger';

const logger = new Logger('Processor');

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

export async function processClickEvent(
  event: ClickEvent,
  env: any
): Promise<'processed' | 'duplicate' | 'failed'> {
  try {
    // Vérifier si c'est un doublon dans les 24h
    const dedupeKey = `click:${event.linkId}:${event.uniqueHash}`;
    const existing = await env.ANALYTICS_CACHE.get(dedupeKey);
    
    if (existing) {
      logger.debug('Duplicate click detected', { linkId: event.linkId });
      return 'duplicate';
    }
    
    // Marquer comme traité (TTL 24h)
    await env.ANALYTICS_CACHE.put(dedupeKey, '1', { expirationTtl: 86400 });
    
    // Déterminer si c'est un clic unique (première fois aujourd'hui)
    const dailyKey = `daily:${event.linkId}:${event.uniqueHash}:${event.timestamp.split('T')[0]}`;
    const dailyExisting = await env.ANALYTICS_CACHE.get(dailyKey);
    const isUnique = !dailyExisting;
    
    if (isUnique) {
      await env.ANALYTICS_CACHE.put(dailyKey, '1', { expirationTtl: 86400 });
    }
    
    // Calculer le CPM
    const cpmRate = getCpmRate(event.countryCode);
    const earnings = cpmRate / 1000;
    
    // Insérer dans D1
    const clickId = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO clicks (
        id, link_id, ip_address, country, country_code, city, region, continent,
        latitude, longitude, timezone, device, device_type, browser, browser_version,
        os, os_version, referrer, referrer_domain, user_agent, language,
        screen_resolution, unique_hash, is_unique, cpm_rate, earnings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clickId, event.linkId, event.ip, event.country, event.countryCode,
      event.city, event.region, event.continent, event.latitude, event.longitude,
      event.timezone, event.device, event.deviceType, event.browser, event.browserVersion,
      event.os, event.osVersion, event.referrer, event.referrerDomain, event.userAgent,
      event.language, event.screenResolution, event.uniqueHash,
      isUnique ? 1 : 0, cpmRate, earnings, event.timestamp
    ).run();
    
    // Mettre à jour le compteur du lien
    await env.DB.prepare(`
      UPDATE links SET current_clicks = current_clicks + 1, updated_at = ?
      WHERE id = ?
    `).bind(event.timestamp, event.linkId).run();
    
    // Si clic unique, ajouter aux earnings
    if (isUnique) {
      const link = await env.DB.prepare(
        'SELECT user_id FROM links WHERE id = ?'
      ).bind(event.linkId).first();
      
      if (link) {
        const earningId = crypto.randomUUID();
        
        await env.DB.prepare(`
          INSERT INTO earnings (id, user_id, amount, source, link_id, status, created_at)
          VALUES (?, ?, ?, 'click', ?, 'approved', ?)
        `).bind(earningId, link.user_id, earnings, event.linkId, event.timestamp).run();
        
        // Mettre à jour le solde utilisateur
        await env.DB.prepare(`
          INSERT INTO user_balances (user_id, available_balance, lifetime_earnings, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            available_balance = available_balance + ?,
            lifetime_earnings = lifetime_earnings + ?,
            updated_at = ?
        `).bind(link.user_id, earnings, earnings, event.timestamp, earnings, earnings, event.timestamp).run();
        
        // Vérifier le parrainage
        const referral = await env.DB.prepare(`
          SELECT r.id, r.referrer_id, r.commission_rate
          FROM referrals r
          WHERE r.referred_user_id = ? AND r.status = 'active'
        `).bind(link.user_id).first();
        
        if (referral) {
          const commission = earnings * (referral.commission_rate / 100);
          const commissionId = crypto.randomUUID();
          
          await env.DB.prepare(`
            INSERT INTO referral_commissions (id, referral_id, referrer_id, referred_user_id, amount, source, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'click', 'approved', ?)
          `).bind(commissionId, referral.id, referral.referrer_id, link.user_id, commission, event.timestamp).run();
          
          // Ajouter la commission au parrain
          await env.DB.prepare(`
            INSERT INTO user_balances (user_id, available_balance, lifetime_earnings, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              available_balance = available_balance + ?,
              lifetime_earnings = lifetime_earnings + ?,
              updated_at = ?
          `).bind(referral.referrer_id, commission, commission, event.timestamp, commission, commission, event.timestamp).run();
        }
      }
    }
    
    logger.debug('Click processed', { 
      clickId, 
      linkId: event.linkId, 
      isUnique, 
      earnings 
    });
    
    return 'processed';
  } catch (error) {
    logger.error('Failed to process click', error, { event });
    return 'failed';
  }
}

function getCpmRate(countryCode: string): number {
  const tier1 = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'DE', 'FR', 'NL', 'BE', 'LU', 'CH', 'AT', 'DK', 'NO', 'SE', 'FI', 'IS'];
  const tier2 = ['ES', 'IT', 'PT', 'GR', 'JP', 'KR', 'SG', 'HK', 'AE', 'QA', 'KW', 'SA', 'IL'];
  const tier3 = ['BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'IN', 'ID', 'PH', 'VN', 'TH', 'MY', 'ZA', 'TR'];
  
  if (tier1.includes(countryCode)) return 4.0;
  if (tier2.includes(countryCode)) return 2.0;
  if (tier3.includes(countryCode)) return 0.5;
  return 0.1;
}
