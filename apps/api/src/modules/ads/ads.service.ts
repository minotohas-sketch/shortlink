import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql, eq, desc } from 'drizzle-orm';
import { users } from '../auth/auth.schema';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';
import { BadRequestError } from '../../utils/errors';

const logger = new Logger('AdsService');

export const adCampaigns = sqliteTable('ad_campaigns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['banner', 'interstitial', 'popup', 'native'] }).notNull(),
  budget: real('budget').notNull(),
  cpmBid: real('cpm_bid').notNull(),
  targetingCountries: text('targeting_countries', { mode: 'json' }),
  targetingDevices: text('targeting_devices', { mode: 'json' }),
  creativeUrl: text('creative_url'),
  destinationUrl: text('destination_url').notNull(),
  impressions: integer('impressions').notNull().default(0),
  status: text('status', { enum: ['active', 'paused', 'ended', 'rejected'] }).notNull().default('active'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('ad_campaigns_user_id_idx').on(table.userId),
}));

export const adImpressions = sqliteTable('ad_impressions', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
  linkId: text('link_id'),
  country: text('country'),
  countryCode: text('country_code'),
  device: text('device'),
  deviceType: text('device_type'),
  browser: text('browser'),
  clicked: integer('clicked', { mode: 'boolean' }).notNull().default(false),
  earnedAmount: real('earned_amount').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  campaignIdIdx: index('ad_impressions_campaign_id_idx').on(table.campaignId),
}));

export interface CreateCampaignInput {
  name: string;
  type: 'banner' | 'interstitial' | 'popup' | 'native';
  budget: number;
  cpmBid: number;
  targetingCountries?: string[];
  targetingDevices?: string[];
  creativeUrl?: string;
  destinationUrl: string;
  startDate?: string;
  endDate?: string;
}

export async function createCampaign(userId: string, input: CreateCampaignInput): Promise<any> {
  const db = getDb();
  if (input.budget < 10) throw new BadRequestError('Minimum budget is $10', 'BUDGET_TOO_LOW');
  if (input.cpmBid < 0.1) throw new BadRequestError('Minimum CPM bid is $0.10', 'CPM_TOO_LOW');
  
  const campaignId = generateUUID();
  const now = nowISO();
  
  await (db.insert as any)(adCampaigns).values({
    id: campaignId, userId, name: input.name, type: input.type,
    budget: input.budget, cpmBid: input.cpmBid,
    targetingCountries: input.targetingCountries || null,
    targetingDevices: input.targetingDevices || null,
    creativeUrl: input.creativeUrl || null,
    destinationUrl: input.destinationUrl,
    startDate: input.startDate || now,
    endDate: input.endDate || null,
    status: 'active', createdAt: now, updatedAt: now,
  });
  
  logger.info('Ad campaign created', { campaignId, userId });
  return db.select().from(adCampaigns).where(eq(adCampaigns.id, campaignId)).get();
}

export async function getCampaigns(userId: string): Promise<any[]> {
  const db = getDb();
  return db.select().from(adCampaigns).where(eq(adCampaigns.userId, userId)).orderBy(desc(adCampaigns.createdAt)).all();
}

export async function recordImpression(
  campaignId: string, linkId: string, country?: string,
  countryCode?: string, device?: string, deviceType?: string, browser?: string
): Promise<void> {
  const db = getDb();
  await (db.insert as any)(adImpressions).values({
    id: generateUUID(), campaignId, linkId,
    country: country || null, countryCode: countryCode || null,
    device: device || null, deviceType: deviceType || null,
    browser: browser || null, clicked: false, earnedAmount: 0, createdAt: nowISO(),
  });
  await (db.update as any)(adCampaigns).set({ impressions: sql`impressions + 1` }).where(eq(adCampaigns.id, campaignId));
}
