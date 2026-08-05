import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { clicks } from '../links/links.schema';
import { links } from '../links/links.schema';
import { eq, and, count, sum, avg, sql, between } from 'drizzle-orm';
import type { Click } from '../links/links.schema';
import { generateUUID } from '../../utils/crypto';
import { nowISO, getDateRange, startOfDay, endOfDay, addDays } from '../../utils/date';
import { getGeoInfo, getDeviceInfo, getCpmRate, getClientIP } from '../../utils/geo';
import type { Context } from 'hono';

const logger = new Logger('ClicksService');

export async function recordClick(linkId: string, c: Context): Promise<void> {
  const db = getDb();
  try {
    const ip = getClientIP(c);
    const geo = getGeoInfo(c);
    const userAgent = c.req.header('User-Agent');
    const referrer = c.req.header('Referer') || '';
    const device = getDeviceInfo(userAgent);
    const language = c.req.header('Accept-Language')?.split(',')[0] || '';
    const cpmRate = getCpmRate(geo.countryCode);
    const earnings = cpmRate / 1000;
    const uniqueHash = await generateUniqueHash(ip, userAgent || '', linkId);
    
    const recentClick = await db.select({ id: clicks.id })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.uniqueHash, uniqueHash)))
      .get();
    
    const isUnique = !recentClick;
    let referrerDomain = '';
    try { if (referrer) referrerDomain = new URL(referrer).hostname; } catch {}
    
    await (db.insert as any)(clicks).values({
      id: generateUUID(), linkId, ipAddress: ip,
      country: geo.country, countryCode: geo.countryCode,
      city: geo.city, region: geo.region, continent: geo.continent,
      latitude: geo.latitude, longitude: geo.longitude, timezone: geo.timezone,
      device: device.device, deviceType: device.deviceType,
      browser: device.browser, browserVersion: device.browserVersion,
      os: device.os, osVersion: device.osVersion,
      referrer: referrer?.substring(0, 2048) || null,
      referrerDomain: referrerDomain || null,
      userAgent: userAgent?.substring(0, 500) || null,
      language, uniqueHash, isUnique, cpmRate, earnings, createdAt: nowISO(),
    });
    
    if (isUnique) {
      const link = await db.select({ userId: links.userId }).from(links).where(eq(links.id, linkId)).get();
      if (link) { /* update earnings */ }
    }
    logger.debug('Click recorded', { linkId, isUnique, country: geo.countryCode });
  } catch (error) {
    logger.error('Failed to record click', error, { linkId });
  }
}

export async function getClickStats(linkId: string, period: string = 'last7days'): Promise<ClickStats> {
  const db = getDb();
  const range = getDateRange(period as any);
  
  const totalResult = await db.select({ total: count(), uniqueTotal: count() })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .get();
  
  const countryResults = await db.select({ country: clicks.countryCode, cnt: count() })
    .from(clicks).where(eq(clicks.linkId, linkId))
    .groupBy(clicks.countryCode).orderBy(sql`cnt DESC`).limit(20).all();
  
  const clicksByCountry: Record<string, number> = {};
  countryResults.forEach(r => { if (r.country) clicksByCountry[r.country] = r.cnt; });
  
  const deviceResults = await db.select({ device: clicks.deviceType, cnt: count() })
    .from(clicks).where(eq(clicks.linkId, linkId)).groupBy(clicks.deviceType).all();
  
  const clicksByDevice: Record<string, number> = {};
  deviceResults.forEach(r => { if (r.device) clicksByDevice[r.device] = r.cnt; });
  
  const browserResults = await db.select({ browser: clicks.browser, cnt: count() })
    .from(clicks).where(eq(clicks.linkId, linkId)).groupBy(clicks.browser).orderBy(sql`cnt DESC`).limit(10).all();
  
  const clicksByBrowser: Record<string, number> = {};
  browserResults.forEach(r => { if (r.browser) clicksByBrowser[r.browser] = r.cnt; });
  
  const dailyResults = await db.select({ date: sql`date(${clicks.createdAt})`, cnt: count() })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .groupBy(sql`date(${clicks.createdAt})`).orderBy(sql`date(${clicks.createdAt})`).all();
  
  const clicksByDate: Record<string, number> = {};
  dailyResults.forEach(r => { if (r.date) clicksByDate[String(r.date)] = r.cnt; });
  
  const earningsResult = await db.select({ avgCpm: avg(clicks.cpmRate), totalEarnings: sum(clicks.earnings) })
    .from(clicks).where(eq(clicks.linkId, linkId)).get();
  
  return {
    totalClicks: Number(totalResult?.total ?? 0),
    uniqueClicks: Number(totalResult?.uniqueTotal ?? 0),
    clicksByCountry, clicksByDevice, clicksByBrowser,
    clicksByReferrer: {},
    clicksByDate,
    averageCpm: Number(earningsResult?.avgCpm ?? 0),
    totalEarnings: Number(earningsResult?.totalEarnings ?? 0),
  };
}

async function generateUniqueHash(ip: string, userAgent: string, linkId: string): Promise<string> {
  const data = `${ip}|${userAgent}|${linkId}|${new Date().toISOString().split('T')[0]}`;
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface ClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByReferrer: Record<string, number>;
  clicksByDate: Record<string, number>;
  averageCpm: number;
  totalEarnings: number;
}
