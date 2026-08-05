import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { clicks } from '../links/links.schema';
import { links } from '../links/links.schema';
import { eq, and, count, sum, avg, desc, between, sql, gte, lte } from 'drizzle-orm';
import { getDateRange, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from '../../utils/date';

const logger = new Logger('AnalyticsService');

export interface AnalyticsOverview {
  period: string;
  startDate: string;
  endDate: string;
  totalClicks: number;
  uniqueClicks: number;
  totalLinks: number;
  activeLinks: number;
  clicksByDate: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByReferrer: Record<string, number>;
  topLinks: TopLink[];
  averageCpm: number;
  totalEarnings: number;
}

export interface TopLink {
  id: string;
  shortCode: string;
  title: string | null;
  originalUrl: string;
  clicks: number;
}

export async function getOverview(
  userId: string,
  period: string = 'last7days'
): Promise<AnalyticsOverview> {
  const db = getDb();
  const range = getDateRange(period as any);
  
  // Total clicks
  const totalClicksResult = await db.select({
    total: count(),
    uniqueTotal: sql`SUM(CASE WHEN ${clicks.isUnique} = 1 THEN 1 ELSE 0 END)`,
    avgCpm: avg(clicks.cpmRate),
    totalEarnings: sum(clicks.earnings),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(
      and(
        eq(links.userId, userId),
        between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())
      )
    )
    .get();
  
  // Total links
  const totalLinksResult = await db.select({ total: count() })
    .from(links)
    .where(eq(links.userId, userId))
    .get();
  
  // Active links
  const activeLinksResult = await db.select({ total: count() })
    .from(links)
    .where(and(eq(links.userId, userId), eq(links.status, 'active')))
    .get();
  
  // Clicks by date
  const dailyClicks = await db.select({
    date: sql`date(${clicks.createdAt})`,
    count: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(
      and(
        eq(links.userId, userId),
        between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())
      )
    )
    .groupBy(sql`date(${clicks.createdAt})`)
    .orderBy(sql`date(${clicks.createdAt})`)
    .all();
  
  const clicksByDate: Record<string, number> = {};
  dailyClicks.forEach(r => { clicksByDate[String(r.date)] = r.count; });
  
  // Clicks by country
  const countryClicks = await db.select({
    country: clicks.countryCode,
    count: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(
      and(
        eq(links.userId, userId),
        between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())
      )
    )
    .groupBy(clicks.countryCode)
    .orderBy(desc(count()))
    .limit(20)
    .all();
  
  const clicksByCountry: Record<string, number> = {};
  countryClicks.forEach(r => {
    if (r.country) clicksByCountry[r.country] = r.count;
  });
  
  // Clicks by device
  const deviceClicks = await db.select({
    device: clicks.deviceType,
    count: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(and(eq(links.userId, userId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .groupBy(clicks.deviceType)
    .all();
  
  const clicksByDevice: Record<string, number> = {};
  deviceClicks.forEach(r => {
    if (r.device) clicksByDevice[r.device] = r.count;
  });
  
  // Clicks by browser
  const browserClicks = await db.select({
    browser: clicks.browser,
    count: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(and(eq(links.userId, userId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .groupBy(clicks.browser)
    .orderBy(desc(count()))
    .limit(10)
    .all();
  
  const clicksByBrowser: Record<string, number> = {};
  browserClicks.forEach(r => {
    if (r.browser) clicksByBrowser[r.browser] = r.count;
  });
  
  // Clicks by referrer
  const referrerClicks = await db.select({
    referrer: clicks.referrerDomain,
    count: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(and(eq(links.userId, userId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .groupBy(clicks.referrerDomain)
    .orderBy(desc(count()))
    .limit(10)
    .all();
  
  const clicksByReferrer: Record<string, number> = {};
  referrerClicks.forEach(r => {
    if (r.referrer) clicksByReferrer[r.referrer] = r.count;
  });
  
  // Top links
  const topLinks = await db.select({
    id: links.id,
    shortCode: links.shortCode,
    title: links.title,
    originalUrl: links.originalUrl,
    clicks: count(),
  })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(and(eq(links.userId, userId), between(clicks.createdAt, range.start.toISOString(), range.end.toISOString())))
    .groupBy(links.id)
    .orderBy(desc(count()))
    .limit(10)
    .all();
  
  return {
    period,
    startDate: range.start.toISOString(),
    endDate: range.end.toISOString(),
    totalClicks: totalClicksResult?.total || 0,
    uniqueClicks: Number(totalClicksResult?.uniqueTotal) || 0,
    totalLinks: totalLinksResult?.total || 0,
    activeLinks: activeLinksResult?.total || 0,
    clicksByDate,
    clicksByCountry,
    clicksByDevice,
    clicksByBrowser,
    clicksByReferrer,
    topLinks: topLinks.map(l => ({
      id: l.id,
      shortCode: l.shortCode,
      title: l.title,
      originalUrl: l.originalUrl,
      clicks: l.clicks,
    })),
    averageCpm: (totalClicksResult?.avgCpm ?? 0) as number,
    totalEarnings: (totalClicksResult?.totalEarnings ?? 0) as number,
  };
}
