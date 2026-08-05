import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { links, clicks } from '../links/links.schema';
import { eq, and, count, sum, desc, sql } from 'drizzle-orm';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';

const logger = new Logger('CampaignsService');

export interface CampaignStats {
  id: string;
  name: string;
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  totalEarnings: number;
  startDate: string;
  endDate?: string;
}

export async function getCampaignStats(
  userId: string,
  utmCampaign?: string
): Promise<CampaignStats[]> {
  const db = getDb();
  
  const conditions = [eq(links.userId, userId)];
  if (utmCampaign) {
    conditions.push(eq(links.utmCampaign, utmCampaign));
  }
  
  const campaigns = await db.select({
    campaign: links.utmCampaign,
    totalLinks: count(),
  })
    .from(links)
    .where(and(...conditions))
    .groupBy(links.utmCampaign)
    .all();
  
  const results: CampaignStats[] = [];
  
  for (const c of campaigns) {
    if (!c.campaign) continue;
    
    const clickStats = await db.select({
      totalClicks: count(),
      uniqueClicks: sql`SUM(CASE WHEN ${clicks.isUnique} = 1 THEN 1 ELSE 0 END)`,
      totalEarnings: sum(clicks.earnings),
    })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(
        and(
          eq(links.userId, userId),
          eq(links.utmCampaign, c.campaign)
        )
      )
      .get();
    
    results.push({
      id: c.campaign,
      name: c.campaign,
      totalLinks: c.totalLinks,
      totalClicks: clickStats?.totalClicks || 0,
      uniqueClicks: Number(clickStats?.uniqueClicks) || 0,
      totalEarnings: Number(clickStats?.totalEarnings ?? 0),
      startDate: '',
    });
  }
  
  return results;
}

export async function createCampaignLink(
  userId: string,
  originalUrl: string,
  campaignName: string,
  utmSource?: string,
  utmMedium?: string
): Promise<any> {
  const db = getDb();
  
  // Générer un short code
  const shortCode = generateShortCode();
  
  const linkId = generateUUID();
  const now = nowISO();
  
  await (db.insert as any)(links).values({
    id: linkId,
    userId,
    shortCode,
    originalUrl,
    utmCampaign: campaignName,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    type: 'campaign',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  
  logger.info('Campaign link created', { linkId, campaignName, userId });
  
  return db.select().from(links).where(eq(links.id, linkId)).get();
}

function generateShortCode(length = 7): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
